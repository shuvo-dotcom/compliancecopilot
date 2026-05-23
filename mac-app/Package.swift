// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ComplianceCopilot",
    platforms: [.macOS(.v13)],
    targets: [
        .executableTarget(
            name: "ComplianceCopilot",
            path: "Sources/ComplianceCopilot",
            resources: [
                .copy("Resources/docker-compose.yml"),
                .copy("Resources/.env.default"),
            ],
            linkerSettings: [
                .linkedFramework("AppKit"),
                .linkedFramework("WebKit"),
            ]
        )
    ]
)
