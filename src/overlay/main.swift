import Cocoa
import WebKit

class OverlayAppDelegate: NSObject, NSApplicationDelegate {
    var window: NSWindow!

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Hide from Dock and Cmd+Tab
        NSApp.setActivationPolicy(.accessory)

        guard let screen = NSScreen.main else {
            print("❌ Головний екран не знайдено.")
            exit(1)
        }

        let screenRect = screen.frame
        // Top banner region: width of screen, height 200px at the top
        let windowRect = NSRect(x: 0, y: screenRect.height - 220, width: screenRect.width, height: 220)

        window = NSWindow(
            contentRect: windowRect,
            styleMask: [.borderless],
            backing: .buffered,
            defer: false
        )

        window.isOpaque = false
        window.backgroundColor = .clear
        window.hasShadow = false
        window.level = .floating
        window.collectionBehavior = [.canJoinAllSpaces, .stationary, .fullScreenAuxiliary]
        
        // Pass mouse clicks through so user can click below (e.g. Antigravity or Dota)
        window.ignoresMouseEvents = true

        let config = WKWebViewConfiguration()
        let webView = WKWebView(frame: NSRect(origin: .zero, size: windowRect.size), configuration: config)
        webView.setValue(false, forKey: "drawsBackground")
        webView.autoresizingMask = [.width, .height]

        if let url = URL(string: "http://localhost:3000/overlay") {
            let request = URLRequest(url: url)
            webView.load(request)
        }

        window.contentView = webView
        window.orderFrontRegardless()

        print("\n🚀 DotaPilot прозорий оверлей успішно активовано!")
        print("💡 Оверлей зафіксований вгорі екрана, фон повністю прозорий, а кліки пролітають крізь нього.")
        print("🛑 Щоб зупинити оверлей, завершіть цей процес або натисніть Ctrl+C.\n")
    }
}

let app = NSApplication.shared
let delegate = OverlayAppDelegate()
app.delegate = delegate
app.run()
