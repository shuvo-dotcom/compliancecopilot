import Foundation

class DockerManager {
    private let supportDir: URL = {
        let dir = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
            .appendingPathComponent("ComplianceCopilot")
        try? FileManager.default.createDirectory(at: dir, withIntermediateDirectories: true)
        return dir
    }()

    private var composeFile: URL { supportDir.appendingPathComponent("docker-compose.yml") }
    private var envFile: URL { supportDir.appendingPathComponent(".env") }

    private var dockerPath: String {
        let candidates = ["/usr/local/bin/docker", "/opt/homebrew/bin/docker", "/Applications/Docker.app/Contents/Resources/bin/docker"]
        return candidates.first { FileManager.default.fileExists(atPath: $0) } ?? "/usr/local/bin/docker"
    }

    func start(completion: @escaping (Bool) -> Void) {
        installBundledFiles()
        run(args: ["compose", "-f", composeFile.path, "--env-file", envFile.path, "up", "-d"], completion: completion)
    }

    func stop(completion: @escaping () -> Void = {}) {
        run(args: ["compose", "-f", composeFile.path, "down"]) { _ in completion() }
    }

    private func installBundledFiles() {
        if !FileManager.default.fileExists(atPath: composeFile.path),
           let src = Bundle.main.url(forResource: "docker-compose", withExtension: "yml") {
            try? FileManager.default.copyItem(at: src, to: composeFile)
        }
        if !FileManager.default.fileExists(atPath: envFile.path),
           let src = Bundle.main.url(forResource: ".env", withExtension: "default") {
            try? FileManager.default.copyItem(at: src, to: envFile)
        }
    }

    private func run(args: [String], completion: @escaping (Bool) -> Void) {
        DispatchQueue.global(qos: .background).async {
            let task = Process()
            task.executableURL = URL(fileURLWithPath: self.dockerPath)
            task.arguments = args
            task.environment = ProcessInfo.processInfo.environment
            task.terminationHandler = { p in completion(p.terminationStatus == 0) }
            try? task.run()
        }
    }
}
