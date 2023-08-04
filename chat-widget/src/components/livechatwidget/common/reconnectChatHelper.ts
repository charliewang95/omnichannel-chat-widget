import { BroadcastEvent } from "../../../common/telemetry/TelemetryConstants";
import { BroadcastService } from "@microsoft/omnichannel-chat-components";
import ChatConfig from "@microsoft/omnichannel-chat-sdk/lib/core/ChatConfig";
import { ConversationMode } from "../../../common/Constants";
import { ICustomEvent } from "@microsoft/omnichannel-chat-components/lib/types/interfaces/ICustomEvent";
import { IReconnectChatContext } from "../../reconnectchatpanestateful/interfaces/IReconnectChatContext";
import { isNullOrUndefined } from "../../../common/utils";

const redirectPage = (redirectURL: string, redirectInSameWindow: boolean) => {
    const redirectPageRequest: ICustomEvent = {
        eventName: BroadcastEvent.RedirectPageRequest,
        payload: {
            redirectURL: redirectURL
        }
    };
    BroadcastService.postMessage(redirectPageRequest);
    if (redirectInSameWindow) {
        window.location.href = redirectURL;
    }
};

const isReconnectEnabled = (chatConfig?: ChatConfig): boolean => {
    if (chatConfig) {
        const reconnectEnabled = chatConfig.LiveWSAndLiveChatEngJoin?.msdyn_enablechatreconnect?.toLowerCase() === "true";
        return reconnectEnabled;
    }
    return false;
};

const isPersistentEnabled = (chatConfig?: ChatConfig): boolean => {
    if (chatConfig) {
        const persistentEnabled = chatConfig.LiveWSAndLiveChatEngJoin?.msdyn_conversationmode?.toLowerCase() === ConversationMode.Persistent;
        return persistentEnabled;
    }
    return false;
};

const hasReconnectId = (reconnectAvailabilityResponse: IReconnectChatContext) => {
    return reconnectAvailabilityResponse && !isNullOrUndefined(reconnectAvailabilityResponse.reconnectId);
};

export { redirectPage, isReconnectEnabled, isPersistentEnabled, hasReconnectId };
