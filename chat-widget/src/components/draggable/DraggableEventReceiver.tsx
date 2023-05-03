import React, { ReactNode, useEffect } from "react";
import DraggableEvent from "./DraggableEvent";

interface DraggableEventReceiverProps {
    /**
     * Unique channel name to send/receive draggable events to prevent event collisions
     */
    channel: string;
    /**
     * React nodes children
     */
    children: ReactNode;
    /**
     * Event handler on receiving draggable events
     *
     * @param event Draggable events
     * @returns
     */
    onEvent: (event: DraggableEvent) => void;
}

const DraggableEventReceiver = (props: DraggableEventReceiverProps) => {
    useEffect(() => {
        const listener = (event: MessageEvent) => {
            const { data } = event;
            if (data.channel === props.channel) {
                console.log(data.eventName);
                props.onEvent(data);
            }
        };

        window.addEventListener("message", listener);

        return () => {
            window.removeEventListener("message", listener);
        };
    }, [props]);

    return <> {props.children} </>;
};

export default DraggableEventReceiver;