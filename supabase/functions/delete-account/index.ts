import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

function validUuid(value: unknown): value is string {
  return (
    value === null ||
    (typeof value === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value))
  )
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (request.method !== 'POST') return json({ error: '仅支持 POST' }, 405)

  const authorization = request.headers.get('Authorization')
  const token = authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: '缺少登录凭据' }, 401)

  const url = Deno.env.get('SUPABASE_URL')
  const anon = Deno.env.get('SUPABASE_ANON_KEY')
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !anon || !service) return json({ error: '注销服务未完成服务器配置' }, 503)

  let body: Record<string, unknown> = {}
  try {
    body = await request.json()
  } catch {
    return json({ error: '请求格式无效' }, 400)
  }
  const expectedSpace = body.expected_space ?? null
  if (!validUuid(expectedSpace)) return json({ error: '空间标识无效' }, 400)

  const caller = createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const {
    data: { user },
    error: userError,
  } = await caller.auth.getUser(token)
  if (userError || !user) return json({ error: '登录已失效，请重新登录后再试' }, 401)

  const { data: prepared, error: prepareError } = await caller.rpc('prepare_account_deletion', {
    expected_space: expectedSpace,
  })
  if (prepareError)
    return json(
      { error: '个人数据准备失败', code: prepareError.code, details: prepareError.message },
      400,
    )

  if (typeof prepared !== 'string') return json({ error: '注销准备结果无效，账号尚未删除' }, 502)
  const admin = createClient(url, service)
  const { data: job, error: jobError } = await admin
    .from('account_deletion_jobs')
    .select('id, expected_space, storage_paths')
    .eq('id', prepared)
    .eq('user_id', user.id)
    .single()
  if (jobError || !job)
    return json(
      { error: '注销准备记录未找到，账号尚未删除；请勿重复提交', details: jobError?.message },
      502,
    )
  const registeredPaths = Array.isArray(job.storage_paths)
    ? job.storage_paths.filter((value): value is string => typeof value === 'string')
    : []
  const prefixes = new Set<string>()
  if (job.expected_space) prefixes.add(`${job.expected_space}/${user.id}`)
  const invalidRegistered = registeredPaths.some((path) => {
    const parts = path.split('/')
    return !(parts.length === 3 && parts[1] === user.id && /^[0-9a-f-]{36}$/i.test(parts[0]))
  })
  if (invalidRegistered)
    return json({ error: '注销准备记录包含异常照片路径；账号尚未删除，请联系管理员' }, 502)
  const ownedRegistered = registeredPaths
  for (const path of ownedRegistered) {
    const parts = path.split('/')
    prefixes.add(`${parts[0]}/${parts[1]}`)
  }
  const paths = new Set(ownedRegistered)
  try {
    for (const prefix of prefixes) {
      let offset = 0
      while (true) {
        const { data: entries, error: listError } = await admin.storage
          .from('couple-photos')
          .list(prefix, { limit: 1000, offset })
        if (listError) throw listError
        for (const entry of entries || []) if (entry.id) paths.add(`${prefix}/${entry.name}`)
        if (!entries || entries.length < 1000) break
        offset += entries.length
      }
    }
    const allPaths = [...paths]
    for (let index = 0; index < allPaths.length; index += 100) {
      const { error: storageError } = await admin.storage
        .from('couple-photos')
        .remove(allPaths.slice(index, index + 100))
      if (storageError) throw storageError
    }
    const remaining = new Set<string>()
    for (const prefix of prefixes) {
      let offset = 0
      while (true) {
        const { data: entries, error: listError } = await admin.storage
          .from('couple-photos')
          .list(prefix, { limit: 1000, offset })
        if (listError) throw listError
        for (const entry of entries || [])
          if (entry.id && paths.has(`${prefix}/${entry.name}`))
            remaining.add(`${prefix}/${entry.name}`)
        if (!entries || entries.length < 1000) break
        offset += entries.length
      }
    }
    if (remaining.size) throw new Error(`删除后仍有 ${remaining.size} 个本人照片对象`)
  } catch (storageError) {
    return json(
      {
        error: '关系资料已匿名化，但照片文件清理未完成；账号尚未删除，请稍后重试',
        details: storageError instanceof Error ? storageError.message : String(storageError),
        prepared: true,
      },
      502,
    )
  }
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError)
    return json(
      {
        error: '个人资料与照片已准备清理，但账号删除未确认；请暂勿重复提交并联系管理员',
        code: deleteError.code,
        details: deleteError.message,
        prepared: true,
      },
      502,
    )

  return json({ deleted: true, prepared_space: job.expected_space ?? null })
})
