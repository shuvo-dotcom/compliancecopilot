import AppKit
import WebKit

class MenuBarController: NSObject, NSWindowDelegate {
    private var statusItem: NSStatusItem!
    private var window: NSWindow?
    private let docker: DockerManager

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
        menu.addItem(item("Open ComplianceCopilot", action: #selector(openWindow), key: "o"))
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

    @objc func openWindow() {
        if window == nil {
            let wv = WKWebView(frame: NSRect(x: 0, y: 0, width: 1280, height: 820))
            wv.load(URLRequest(url: URL(string: "http://localhost:3000")!))
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
        }
        window?.makeKeyAndOrderFront(nil)
        NSApp.activate(ignoringOtherApps: true)
    }

    @objc func startStack() {
        docker.start { _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 4) { self.openWindow() }
        }
    }

    @objc func stopStack() { docker.stop() }

    func windowWillClose(_ notification: Notification) { window = nil }
}
