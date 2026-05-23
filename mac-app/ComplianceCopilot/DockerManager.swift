import Foundation

class DockerManager {
    private let composePath: String

    init() {
        // docker-compose.yml ships inside the app bundle
        composePath = Bundle.main.path(forResource: "docker-compose", ofType: "yml") ?? ""
    }

    func start(completion: @escaping (Bool) -> Void) {
        run(args: ["compose", "-f", composePath, "up", "-d"]) { code in
            completion(code == 0)
        }
    }

    func stop() {
        run(args: ["compose", "-f", composePath, "down"]) { _ in }
    }

    private func run(args: [String], completion: @escaping (Int32) -> Void) {
        let task = Process()
        task.executableURL = URL(fileURLWithPath: "/usr/local/bin/docker")
        task.arguments = args
        task.terminationHandler = { process in
            completion(process.terminationStatus)
        }
        try? task.run()
    }
}
