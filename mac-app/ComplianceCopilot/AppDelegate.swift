import AppKit

@main
class AppDelegate: NSObject, NSApplicationDelegate {
    private var menuBarController: MenuBarController!

    func applicationDidFinishLaunching(_ notification: Notification) {
        menuBarController = MenuBarController()
        NSApp.setActivationPolicy(.accessory)
    }
}
