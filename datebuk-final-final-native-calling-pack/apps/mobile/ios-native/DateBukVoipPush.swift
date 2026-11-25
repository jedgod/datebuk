import Foundation
import PushKit
import CallKit
import React

@objc(DateBukVoipPush)
final class DateBukVoipPush: RCTEventEmitter, PKPushRegistryDelegate, CXProviderDelegate {
  static let shared = DateBukVoipPush()

  private let registry = PKPushRegistry(queue: .main)
  private let provider: CXProvider
  private var hasListeners = false

  override init() {
    let config = CXProviderConfiguration(localizedName: "DateBuk")
    config.supportsVideo = true
    config.maximumCallGroups = 1
    config.maximumCallsPerCallGroup = 1
    config.supportedHandleTypes = [.generic]

    provider = CXProvider(configuration: config)
    super.init()

    provider.setDelegate(self, queue: nil)
    registry.delegate = self
    registry.desiredPushTypes = [.voIP]
  }

  @objc func start() {
    registry.delegate = self
    registry.desiredPushTypes = [.voIP]
  }

  override static func requiresMainQueueSetup() -> Bool { true }

  override func supportedEvents() -> [String]! {
    ["voipToken", "incomingVoipCall", "callAnswered", "callEnded"]
  }

  override func startObserving() { hasListeners = true }
  override func stopObserving() { hasListeners = false }

  func pushRegistry(
    _ registry: PKPushRegistry,
    didUpdate pushCredentials: PKPushCredentials,
    for type: PKPushType
  ) {
    let token = pushCredentials.token.map {
      String(format: "%02x", $0)
    }.joined()

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
    let callId = UUID(uuidString: callIdString) ?? UUID()
    let callerId = data["callerId"] as? String ?? "unknown"
    let callerName = data["callerName"] as? String ?? "DateBuk member"
    let callType = data["callType"] as? String ?? "VOICE"

    let update = CXCallUpdate()
    update.remoteHandle = CXHandle(type: .generic, value: callerId)
    update.localizedCallerName = callerName
    update.hasVideo = callType == "VIDEO"

    provider.reportNewIncomingCall(with: callId, update: update) { [weak self] error in
      if error == nil, self?.hasListeners == true {
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

  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    if hasListeners {
      sendEvent(withName: "callAnswered", body: ["callId": action.callUUID.uuidString])
    }
    action.fulfill()
  }

  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    if hasListeners {
      sendEvent(withName: "callEnded", body: ["callId": action.callUUID.uuidString])
    }
    action.fulfill()
  }

  func providerDidReset(_ provider: CXProvider) {}
}
