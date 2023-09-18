/******
 * CopilotMiddleware
 * 
 * This middleware read all history messages and suggests a potential customer reply.
 ******/

import { AzureKeyCredential, ChatMessage, OpenAIClient } from "@azure/openai";

import { Constants } from "../../../../../common/Constants";
import { DirectLineSenderRole } from "../../enums/DirectLineSenderRole";
import { Dispatch } from "react";
import { ILiveChatWidgetAction } from "../../../../../contexts/common/ILiveChatWidgetAction";
import { IWebChatAction } from "../../../interfaces/IWebChatAction";
import { LiveChatWidgetActionType } from "../../../../../contexts/common/LiveChatWidgetActionType";
import { WebChatActionType } from "../../enums/WebChatActionType";
import { isNullOrEmptyString } from "../../../../../common/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
const createCopilotMiddleware = (dispatch: Dispatch<ILiveChatWidgetAction>) => {
    const endpoint = "https://cit-openai-dev.openai.azure.com/";
    const azureApiKey = "";
    const deploymentId = "cit-gpt-35-turbo";

    const messages: ChatMessage[] = [];

    const client = new OpenAIClient(endpoint, new AzureKeyCredential(azureApiKey));

    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any
    const copilotMiddleware = () => (next: any) => async (action: IWebChatAction) => {
        if (action?.type == WebChatActionType.DIRECT_LINE_INCOMING_ACTIVITY && action.payload?.activity) {
            const activity = action.payload.activity;
            if (!activity.from?.role ||
                activity.from?.role === DirectLineSenderRole.Channel ||
                activity.channelData?.tags?.includes(Constants.hiddenTag) ||
                activity.channelData?.tags?.includes(Constants.systemMessageTag) ||
                isNullOrEmptyString(activity.text)) {
                return next(action);
            }

            messages.push({
                role: activity.from?.role === DirectLineSenderRole.User ? "user" : "assistant",
                content: activity.from?.role === DirectLineSenderRole.User ? activity.text :
                    `The customer service agent said: "${activity.text}". Pretend you are now the customer and give a response.`
            });

            if (activity.from?.role === DirectLineSenderRole.User) {
                return next(action);
            }
            
            const result = await client.getChatCompletions(deploymentId, messages, {maxTokens: 60, topP: 0.01, n: 1});
        
            if (result.choices?.length > 0) {
                let suggestedReply = result.choices[0].message?.content;
                if (suggestedReply?.startsWith("\"") && suggestedReply?.endsWith("\"")) suggestedReply = suggestedReply.substring(1, suggestedReply.length - 1);

                if (suggestedReply) {
                    dispatch({ type: LiveChatWidgetActionType.SET_SUGGESTED_RESPONSE, payload: suggestedReply });
                }
            }
        }

        return next(action);
    };

    return copilotMiddleware;
};

export default createCopilotMiddleware;