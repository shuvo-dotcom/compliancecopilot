import AppKit
import WebKit

class MenuBarController: NSObject, NSWindowDelegate {
    private var statusItem: NSStatusItem!
    private let docker: DockerManager
    private var window: NSWindow?
    private var webView: WKWebView?

    init(docker: DockerManager) {
        self.docker = docker
        super.init()
        buildStatusItem()
    }

    private func buildStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        if let btn = statusItem.button {
            btn.image = NSImage(systemSymbolName: "checkmark.shield.fill",
                                accessibilityDescription: "ComplianceCopilot")
        }
        let menu = NSMenu()
        menu.addItem(item("Open ComplianceCopilot", action: #selector(openApp), key: "o"))
        menu.addItem(.separator())
        menu.addItem(item("Start Stack", action: #selector(startStack), key: ""))
        menu.addItem(item("Stop Stack",  action: #selector(stopStack),  key: ""))
        menu.addItem(.separator())
        menu.addItem(item("Quit", action: #selector(NSApplication.terminate(_:)), key: "q"))
        statusItem.menu = menu
    }

    private func item(_ title: String, action: Selector, key: String) -> NSMenuItem {
        let i = NSMenuItem(title: title, action: action, keyEquivalent: key)
        i.target = self
        return i
    }

    /// Fetch a one-time machine token from the local API, then open the app
    /// window pointing at /machine-auth?token=... for seamless auto-login.
    @objc func openApp() {
        guard let url = URL(string: "http://localhost:8000/auth/machine-token") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        URLSession.shared.dataTask(with: req) { data, _, error in
            DispatchQueue.main.async {
                var target = URL(string: "http://localhost:3000")!
                if let data = data,
                   let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let token = json["token"] as? String {
                    target = URL(string: "http://localhost:3000/machine-auth?token=\(token)")!
                }
                self.showWindow(url: target)
            }
        }.resume()
    }

    private func showWindow(url: URL) {
        if window == nil {
            let config = WKWebViewConfiguration()
            config.websiteDataStore = .nonPersistent() // fresh cookies each window open
            let wv = WKWebView(frame: NSRect(x: 0, y: 0, width: 1280, height: 820), configuration: config)

            let win = NSWindow(
                contentRect: NSRect(x: 0, y: 0, width: 1280, height: 820),
                styleMask: [.titled, .closable, .miniaturizable, .resizable, .fullSizeContentView],
                backing: .buffered, defer: false)
            win.title = "ComplianceCopilot"
            win.contentView = wv
            win.center()
            win.delegate = self
            win.isReleasedWhenClosed = false
            window = win
            webView = wv
        }
        webView?.load(URLRequest(url: url))
        window?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    @objc func startStack() {
        docker.start { _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 5) {
                self.openApp()
            }
        }
    }

    @objc func stopStack() { docker.stop() }

    func windowWillClose(_ notification: Notification) {
        window = nil
        webView = nil
    }
}
