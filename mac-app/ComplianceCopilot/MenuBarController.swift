import AppKit
import SwiftUI

class MenuBarController: NSObject {
    private var statusItem: NSStatusItem!
    private var dockerManager = DockerManager()

    override init() {
        super.init()
        setupMenuBar()
    }

    private func setupMenuBar() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)

        if let button = statusItem.button {
            button.image = NSImage(systemSymbolName: "checkmark.shield", accessibilityDescription: "ComplianceCopilot")
        }

        let menu = NSMenu()
        menu.addItem(NSMenuItem(title: "Open ComplianceCopilot", action: #selector(openApp), keyEquivalent: "o"))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Start", action: #selector(startStack), keyEquivalent: "s"))
        menu.addItem(NSMenuItem(title: "Stop", action: #selector(stopStack), keyEquivalent: "x"))
        menu.addItem(NSMenuItem.separator())
        menu.addItem(NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))

        statusItem.menu = menu
    }

    @objc func openApp() {
        NSWorkspace.shared.open(URL(string: "http://localhost:3000")!)
    }

    @objc func startStack() {
        dockerManager.start { success in
            DispatchQueue.main.async {
                if success { self.openApp() }
            }
        }
    }

    @objc func stopStack() {
        dockerManager.stop()
    }
}
