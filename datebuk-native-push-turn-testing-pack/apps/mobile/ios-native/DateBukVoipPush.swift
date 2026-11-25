import Foundation
import PushKit
import CallKit
import React

@objc(DateBukVoipPush)
final class DateBukVoipPush: RCTEventEmitter, PKPushRegistryDelegate {
  static let shared = DateBukVoipPush()

  private let registry = PKPushRegistry(queue: .main)
  private let provider: CXProvider
  private var hasListeners = false

  override init() {
    let configuration = CXProviderConfiguration(localizedName: "DateBuk")
    configuration.supportsVideo = true
    configuration.maximumCallGroups = 1
    configuration.maximumCallsPerCallGroup = 1
    configuration.supportedHandleTypes = [.generic]

    provider = CXProvider(configuration: configuration)
    super.init()

    registry.delegate = self
    registry.desiredPushTypes = [.voIP]
  }

  @objc func start() {
    registry.delegate = self
    registry.desiredPushTypes = [.voIP]
  }

  override static func requiresMainQueueSetup() -> Bool {
    return true
  }

  override func supportedEvents() -> [String]! {
    return ["voipToken", "incomingVoipCall"]
  }

  override func startObserving() {
    hasListeners = true
  }

  override func stopObserving() {
    hasListeners = false
  }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didUpdate pushCredentials: PKPushCredentials,
    for type: PKPushType
  ) {
    let token = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
    if hasListeners {
      sendEvent(withName: "voipToken", body: ["token": token])
    }
  }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didReceiveIncomingPushWith payload: PKPushPayload,
    for type: PKPushType,
    completion: @escaping () -> Void
  ) {
    guard type == .voIP else {
      completion()
      return
    }

    let data = payload.dictionaryPayload
    let callIdString = data["callId"] as? String ?? UUID().uuidString
    let callerName = data["callerName"] as? String ?? "DateBuk member"
    let callerId = data["callerId"] as? String ?? "unknown"
    let callType = data["callType"] as? String ?? "VOICE"
    let callId = UUID(uuidString: callIdString) ?? UUID()

    let update = CXCallUpdate()
    update.remoteHandle = CXHandle(type: .generic, value: callerId)
    update.localizedCallerName = callerName
    update.hasVideo = callType == "VIDEO"

    provider.reportNewIncomingCall(with: callId, update: update) { [weak self] error in
      if let error = error {
        NSLog("DateBuk CallKit error: \(error.localizedDescription)")
      } else if self?.hasListeners == true {
        self?.sendEvent(
          withName: "incomingVoipCall",
          body: [
            "callId": callIdString,
            "callerId": callerId,
            "callerName": callerName,
            "callType": callType
          ]
        )
      }
      completion()
    }
  }
}
