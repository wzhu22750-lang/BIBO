package love.bibu.space;

import android.graphics.Color;
import android.os.Bundle;
import androidx.activity.EdgeToEdge;
import androidx.activity.SystemBarStyle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // 沉浸式：内容延伸到状态栏(含刘海)与系统导航栏(含手势条)下方，
        // 具体偏移由 Web 侧 env(safe-area-inset-*) 统一适配。
        // 固定使用浅色系统条（深色图标），匹配应用纸色主题。
        EdgeToEdge.enable(
                this,
                SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT),
                SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT));
        super.onCreate(savedInstanceState);
    }
}
