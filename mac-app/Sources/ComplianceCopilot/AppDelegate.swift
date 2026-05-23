import AppKit

class AppDelegate: NSObject, NSApplicationDelegate {
    var menuBar: MenuBarController!
    let docker = DockerManager()

    func applicationDidFinishLaunching(_ notification: Notification) {
        NSApp.setActivationPolicy(.accessory)
        menuBar = MenuBarController(docker: docker)
        docker.start { success in
            DispatchQueue.main.asyncAfter(deadline: .now() + 4) {
                self.menuBar.openWindow()
            }
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ app: NSApplication) -> Bool {
        false
    }
}
