import Foundation
import UIKit
import UniformTypeIdentifiers
import Capacitor

/**
 * Öffnet den System-Document-Picker möglichst in Dokumente / iCloud Drive.
 * (Nur in der nativen iOS-Hülle — Safari/PWA kann das nicht.)
 */
@objc(DocumentsPickerPlugin)
public class DocumentsPickerPlugin: CAPPlugin, CAPBridgedPlugin, UIDocumentPickerDelegate, UINavigationControllerDelegate {
    public let identifier = "DocumentsPickerPlugin"
    public let jsName = "DocumentsPicker"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "pickDocuments", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "isAvailable", returnType: CAPPluginReturnPromise),
    ]

    private var pendingCall: CAPPluginCall?

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": true])
    }

    @objc func pickDocuments(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self else { return }

            if self.pendingCall != nil {
                call.reject("Ein Datei-Dialog ist bereits offen.")
                return
            }

            self.pendingCall = call

            var contentTypes: [UTType] = [.pdf, .image, .jpeg, .png, .webP]
            if let heic = UTType("public.heic") {
                contentTypes.append(heic)
            }
            if let heif = UTType("public.heif") {
                contentTypes.append(heif)
            }

            let picker = UIDocumentPickerViewController(forOpeningContentTypes: contentTypes, asCopy: true)
            picker.delegate = self
            picker.allowsMultipleSelection = call.getBool("multiple") ?? true
            picker.modalPresentationStyle = .fullScreen
            // Kein directoryURL — sonst landet man in der App-Sandbox statt im vollen Dateien-Dialog.

            guard let presenter = self.bridge?.viewController else {
                self.pendingCall = nil
                call.reject("Kein ViewController für den Datei-Dialog.")
                return
            }

            presenter.present(picker, animated: true)
        }
    }

    public func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
        defer { pendingCall = nil }

        guard let call = pendingCall else { return }

        var files: [[String: Any]] = []

        for url in urls {
            let accessed = url.startAccessingSecurityScopedResource()
            defer {
                if accessed {
                    url.stopAccessingSecurityScopedResource()
                }
            }

            do {
                let data = try Data(contentsOf: url)
                let name = url.lastPathComponent
                let mime = Self.mimeType(for: url) ?? "application/octet-stream"
                files.append([
                    "name": name,
                    "mimeType": mime,
                    "base64": data.base64EncodedString(),
                    "size": data.count,
                ])
            } catch {
                call.reject("Datei konnte nicht gelesen werden: \(nameOrPath(url))", nil, error)
                return
            }
        }

        call.resolve(["files": files])
    }

    public func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
        pendingCall?.reject("abgebrochen", "USER_CANCELED")
        pendingCall = nil
    }

    private static func mimeType(for url: URL) -> String? {
        if let type = UTType(filenameExtension: url.pathExtension),
           let mime = type.preferredMIMEType {
            return mime
        }
        switch url.pathExtension.lowercased() {
        case "pdf": return "application/pdf"
        case "jpg", "jpeg": return "image/jpeg"
        case "png": return "image/png"
        case "webp": return "image/webp"
        case "heic": return "image/heic"
        case "heif": return "image/heif"
        default: return nil
        }
    }

    private func nameOrPath(_ url: URL) -> String {
        url.lastPathComponent
    }
}
