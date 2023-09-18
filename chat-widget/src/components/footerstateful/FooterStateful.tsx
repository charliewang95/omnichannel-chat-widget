import { IButtonStyles, IconButton } from "@fluentui/react";
import { LogLevel, TelemetryEvent } from "../../common/telemetry/TelemetryConstants";
import React, { Dispatch, useEffect, useState } from "react";

import AudioNotificationStateful from "./audionotificationstateful/AudioNotificationStateful";
import { Constants } from "../../common/Constants";
import { Footer } from "@microsoft/omnichannel-chat-components";
import { IFooterControlProps } from "@microsoft/omnichannel-chat-components/lib/types/components/footer/interfaces/IFooterControlProps";
import { ILiveChatWidgetAction } from "../../contexts/common/ILiveChatWidgetAction";
import { ILiveChatWidgetContext } from "../../contexts/common/ILiveChatWidgetContext";
import { LiveChatWidgetActionType } from "../../contexts/common/LiveChatWidgetActionType";
import { NewMessageNotificationSoundBase64 } from "../../assets/Audios";
import { NotificationHandler } from "../webchatcontainerstateful/webchatcontroller/notification/NotificationHandler";
import { NotificationScenarios } from "../webchatcontainerstateful/webchatcontroller/enums/NotificationScenarios";
import { TelemetryHelper } from "../../common/telemetry/TelemetryHelper";
import { downloadTranscript } from "./downloadtranscriptstateful/DownloadTranscriptStateful";
import { hooks } from "botframework-webchat";
import useChatContextStore from "../../hooks/useChatContextStore";
import useChatSDKStore from "../../hooks/useChatSDKStore";

const hoveredStyles = {
    filter: "brightness(0.8)",
    backgroundColor: "#C8C8C8"
};

const iconButtonStyles: IButtonStyles = {
    icon: {
        color: "blue",
        fontSize: 16,
    },
    root: {
        height: "25px",
        lineHeight: "25px",
        width: "25px"
    },
    rootHovered: hoveredStyles,
    rootFocused: hoveredStyles,
    rootPressed: hoveredStyles
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const FooterStateful = (props: any) => {
    const [aiDisabled, setAiDisabled] = useState(false);

    const CopilotButton = () => {
        const handleOnClick = () => {
            setAiDisabled(disabled => !disabled);
        };
    
        return (
            <IconButton
                id={"copilot"}
                iconProps={{iconName: (aiDisabled ? "Unknown" : "UnknownSolid")}}
                onClick={handleOnClick}
                styles={iconButtonStyles}
            />
        );
    };
    const [state, dispatch]: [ILiveChatWidgetContext, Dispatch<ILiveChatWidgetAction>] = useChatContextStore();
    // hideFooterDisplay - the purpose of this is to keep the footer always "active",
    // but hide it visually in certain states (e.g., loading state) and show in some other states (e.g. active state).
    // The reason for this approach is to make sure that state variables for audio notification work correctly after minimizing
    const { footerProps, downloadTranscriptProps, audioNotificationProps, hideFooterDisplay } = props;
    const { useSendBoxValue } = hooks;
    const [, setSendBoxValue] = useSendBoxValue();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chatSDK: any = useChatSDKStore();
    const controlProps: IFooterControlProps = {
        id: "oc-lcw-footer",
        dir: state.domainStates.globalDir,
        onDownloadTranscriptClick: async () => {
            try {
                TelemetryHelper.logActionEvent(LogLevel.INFO, { Event: TelemetryEvent.DownloadTranscriptButtonClicked, Description: "Download Transcript button clicked." });
                await downloadTranscript(chatSDK, downloadTranscriptProps, state);
            } catch (ex) {
                TelemetryHelper.logActionEvent(LogLevel.ERROR, {
                    Event: TelemetryEvent.DownloadTranscriptFailed,
                    ExceptionDetails: {
                        exception: ex
                    }
                });
                NotificationHandler.notifyError(
                    NotificationScenarios.DownloadTranscriptError,
                    downloadTranscriptProps?.bannerMessageOnError ?? Constants.defaultDownloadTranscriptError);
            }
        },
        onEmailTranscriptClick: () => {
            TelemetryHelper.logActionEvent(LogLevel.INFO, { Event: TelemetryEvent.EmailTranscriptButtonClicked, Description: "Email Transcript button clicked." });
            const emailTranscriptButtonId = footerProps?.controlProps?.emailTranscriptButtonProps?.id ?? `${controlProps.id}-emailtranscript-button`;
            if (emailTranscriptButtonId) {
                dispatch({ type: LiveChatWidgetActionType.SET_PREVIOUS_FOCUSED_ELEMENT_ID, payload: emailTranscriptButtonId });
            }
            dispatch({ type: LiveChatWidgetActionType.SET_SHOW_EMAIL_TRANSCRIPT_PANE, payload: true });
        },
        onAudioNotificationClick: () => {
            TelemetryHelper.logActionEvent(LogLevel.INFO, { Event: TelemetryEvent.AudioToggleButtonClicked, Description: "Audio button clicked." });
            dispatch({ type: LiveChatWidgetActionType.SET_AUDIO_NOTIFICATION, payload: !state.appStates.isAudioMuted });
        },
        ...footerProps?.controlProps,
        audioNotificationButtonProps: {
            ...footerProps?.controlProps?.audioNotificationButtonProps,
            isAudioMuted: state.appStates.isAudioMuted
        },
        rightGroup: {
            children: [
                <CopilotButton key="copilotButton"/>
            ]
        }
    };

    useEffect(() => {
        if (!aiDisabled && state.appStates.aiSuggestedReply.message !== "") {
            NotificationHandler.notifyInfo(NotificationScenarios.SuggestedReply, state.appStates.aiSuggestedReply.message);
        }
    }, [state.appStates.aiSuggestedReply.message]);

    useEffect(() => {
        if (!aiDisabled) {
            setSendBoxValue(state.appStates.aiSuggestedReply.message);
            NotificationHandler.dismissNotification(NotificationScenarios.SuggestedReply);
        }
    }, [state.appStates.aiSuggestedReply.id]);

    useEffect(() => {
        if (aiDisabled) {
            NotificationHandler.dismissNotification(NotificationScenarios.SuggestedReply);
        }
    }, [aiDisabled]);

    return (
        <>
            {!hideFooterDisplay &&
                <Footer
                    componentOverrides={footerProps?.componentOverrides}
                    controlProps={controlProps}
                    styleProps={footerProps?.styleProps}
                />
            }
            <AudioNotificationStateful
                audioSrc={audioNotificationProps?.audioSrc ?? NewMessageNotificationSoundBase64}
                isAudioMuted={state.appStates.isAudioMuted === null ?
                    footerProps?.controlProps?.hideAudioNotificationButton ?? false :
                    state.appStates.isAudioMuted ?? false}
            />
        </>
    );
};

export default FooterStateful;