import AppKit

class AppDelegate: NSObject, NSApplicationDelegate {
    var menuBar: MenuBarController!
    let docker = DockerManager()

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Enforce single instance — quit if already running
        let running = NSWorkspace.shared.runningApplications
        let me = Bundle.main.bundleIdentifier ?? ""
        if running.filter({ $0.bundleIdentifier == me }).count > 1 {
            NSApp.terminate(nil)
            return
        }

        NSApp.setActivationPolicy(.accessory)
        menuBar = MenuBarController(docker: docker)
        docker.start { success in
            // Don't open immediately — wait until the web service is actually ready
            self.menuBar.waitForStackThenOpen()
        }
    }

    func applicationWillTerminate(_ notification: Notification) {
        // Stop the Docker stack synchronously before the process exits
        let sema = DispatchSemaphore(value: 0)
        docker.stop { sema.signal() }
        _ = sema.wait(timeout: .now() + 15)
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ app: NSApplication) -> Bool {
        false
    }
}
