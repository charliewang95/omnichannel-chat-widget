import React, { Dispatch } from "react";

import { ILiveChatWidgetAction } from "../../../../../contexts/common/ILiveChatWidgetAction";
import { INotificationPaneProps } from "@microsoft/omnichannel-chat-components/lib/types/components/notificationpane/interfaces/INotificationPaneProps";
import { LiveChatWidgetActionType } from "../../../../../contexts/common/LiveChatWidgetActionType";
import NotificationPaneStateful from "../../../../notificationpanestateful/NotificationPaneStateful";
import { NotificationScenarios } from "../../enums/NotificationScenarios";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const createToastMiddleware = (notificationPaneProps: INotificationPaneProps | undefined, endChat: any, dispatch: Dispatch<ILiveChatWidgetAction>) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, react/display-name
    const toastMiddleware = () => (next: any) => (card: any) => {
        const {notification} = card;

        const suggestedReplyProps: INotificationPaneProps = {
            chatDisconnectNotificationProps: {
                controlProps: {
                    titleText: "AI suggested response:",
                    subtitleText: notification.message,
                    closeChatButtonProps: {
                        text: "Edit",
                        onClick: () => edit()
                    }

                },
                styleProps: {
                    generalStyleProps: {
                        backgroundColor: "#d3d3d3"
                    }
                }
            }
        };

        const edit = async () => {
            dispatch({ type: LiveChatWidgetActionType.INCREMENT_SUGGESTED_RESPONSE_ID, payload: {}});
        };
        
        if (notification.id === NotificationScenarios.SuggestedReply) {
            return <NotificationPaneStateful notificationPaneProps={suggestedReplyProps} notificationScenarioType={NotificationScenarios.SuggestedReply} endChat={() => edit()} />;
        }

        if (notificationPaneProps) {
            if (notification.id === NotificationScenarios.ChatDisconnect) {
                return <NotificationPaneStateful notificationPaneProps={notificationPaneProps} notificationScenarioType={NotificationScenarios.ChatDisconnect} endChat={endChat} />;
            }
    
            // TODO: additional notification scenarios to be added...
        }
        
        return next(card);
    };

    return toastMiddleware;
};

export default createToastMiddleware;