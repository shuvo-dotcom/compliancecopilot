import AppKit

class MenuBarController: NSObject {
    private var statusItem: NSStatusItem!
    private let docker: DockerManager
    private let appURL = URL(string: "http://localhost:3000")!

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
        menu.addItem(item("Open ComplianceCopilot", action: #selector(openInBrowser), key: "o"))
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

    @objc func openInBrowser() {
        NSWorkspace.shared.open(appURL)
    }

    @objc func startStack() {
        docker.start { _ in
            DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                self.openInBrowser()
            }
        }
    }

    @objc func stopStack() { docker.stop() }
}
