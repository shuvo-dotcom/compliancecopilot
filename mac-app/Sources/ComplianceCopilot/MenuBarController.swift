import AppKit
import WebKit

class MenuBarController: NSObject, NSWindowDelegate {
    private var statusItem: NSStatusItem!
    private let docker: DockerManager
    private var pollTimer: Timer?

    init(docker: DockerManager) {
        self.docker = docker
        super.init()
        buildStatusItem()
    }

    private func buildStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
        setIcon("checkmark.shield.fill")
        let menu = NSMenu()
        menu.addItem(item("Open ComplianceCopilot", action: #selector(openApp), key: "o"))
        menu.addItem(.separator())
        menu.addItem(item("Start Stack", action: #selector(startStack), key: ""))
        menu.addItem(item("Stop Stack",  action: #selector(stopStack),  key: ""))
        menu.addItem(.separator())
        menu.addItem(item("Quit", action: #selector(quitApp), key: "q"))
        statusItem.menu = menu
    }

    private func setIcon(_ symbolName: String) {
        statusItem.button?.image = NSImage(systemSymbolName: symbolName,
                                           accessibilityDescription: "ComplianceCopilot")
    }

    private func item(_ title: String, action: Selector, key: String) -> NSMenuItem {
        let i = NSMenuItem(title: title, action: action, keyEquivalent: key)
        i.target = self
        return i
    }

    // MARK: - Stack readiness polling

    /// Called by AppDelegate after docker.start() completes.
    /// Polls localhost:3000 until it responds, then opens the app.
    func waitForStackThenOpen() {
        DispatchQueue.main.async {
            self.setIcon("clock")
            self.pollTimer?.invalidate()
            self.pollTimer = Timer.scheduledTimer(withTimeInterval: 2.0, repeats: true) { [weak self] _ in
                self?.checkReadiness()
            }
        }
    }

    private func checkReadiness() {
        guard let url = URL(string: "http://localhost:3000") else { return }
        let task = URLSession.shared.dataTask(with: url) { [weak self] _, response, _ in
            let ready = (response as? HTTPURLResponse)?.statusCode != nil
            if ready {
                DispatchQueue.main.async {
                    self?.pollTimer?.invalidate()
                    self?.pollTimer = nil
                    self?.setIcon("checkmark.shield.fill")
                    self?.openApp()
                }
            }
        }
        task.resume()
    }

    // MARK: - Open app

    /// Fetch a one-time machine token, then open the app in Chrome app mode.
    @objc func openApp() {
        // If stack isn't up yet, start polling instead of opening immediately
        guard pollTimer == nil else { return }

        guard let url = URL(string: "http://localhost:8000/auth/machine-token") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        URLSession.shared.dataTask(with: req) { data, _, _ in
            DispatchQueue.main.async {
                var target = "http://localhost:3000"
                if let data = data,
                   let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                   let token = json["token"] as? String {
                    target = "http://localhost:3000/machine-auth?token=\(token)"
                }
                self.openInBrowserAppMode(urlString: target)
            }
        }.resume()
    }

    // MARK: - Browser launch

    private func openInBrowserAppMode(urlString: String) {
        if launchChromium(urlString: urlString) { return }
        if launchSafari(urlString: urlString)   { return }
        if let url = URL(string: urlString) { NSWorkspace.shared.open(url) }
    }

    private func launchChromium(urlString: String) -> Bool {
        let candidates = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Chromium.app/Contents/MacOS/Chromium",
            "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        ]
        guard let path = candidates.first(where: { FileManager.default.fileExists(atPath: $0) }) else {
            return false
        }
        let task = Process()
        task.executableURL = URL(fileURLWithPath: path)
        task.arguments = ["--app=\(urlString)", "--window-size=1280,820", "--disable-extensions"]
        return (try? task.run()) != nil
    }

    private func launchSafari(urlString: String) -> Bool {
        guard FileManager.default.fileExists(atPath: "/Applications/Safari.app") else { return false }
        let script = "tell application \"Safari\" to open location \"\(urlString)\""
        var err: NSDictionary?
        NSAppleScript(source: script)?.executeAndReturnError(&err)
        return err == nil
    }

    // MARK: - Stack control

    @objc func startStack() {
        setIcon("clock")
        docker.start { [weak self] _ in
            self?.waitForStackThenOpen()
        }
    }

    @objc func stopStack() {
        pollTimer?.invalidate()
        pollTimer = nil
        setIcon("checkmark.shield.fill")
        docker.stop {}
    }

    @objc func quitApp() {
        NSApp.terminate(self)
    }
}
