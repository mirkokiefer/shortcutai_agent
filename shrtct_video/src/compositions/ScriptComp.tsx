import { AbsoluteFill, OffthreadVideo, Sequence, Audio, continueRender, delayRender } from 'remotion';
import { Logo } from '../components/Logo';
import { Subtitle } from '../components/Subtitle';
import { Title } from '../components/Title';
import { useCallback, useEffect, useState } from 'react';
import { Caption } from '../components/Caption';
import { getVideoMetadata, useAudioData } from "@remotion/media-utils";

function vid(url: string) {
    return `http://localhost/yt-dlp?url=${url}&format=mp4`;
}

function voice(text: string) {
    return `https://shrtct.ai/api/voice?text=${encodeURIComponent(text)}`;
}

export const exampleScript = {
    title: 'Welcome to ShortcutAI',
    subtitle: 'A new way to create shortcuts',
    logo: 'https://shrtct.ai/logo.png',
    color: '#000000',
    accentColor: '#ffffff',
    background: '#ffffff',
    duration: 10,
    segments: [
        {
            tweet: 'https://twitter.com/AiBreakfast/status/1671298165436301312',
            duration: 1
        },
        {
            tweet: 'https://twitter.com/AiBreakfast/status/1670950820089589761?s=20',
            duration: 1
        },
        {
            tweet: 'https://twitter.com/AiBreakfast/status/1669816017890029569?s=20',
            duration: 1
        },
        {
            tweet: 'https://twitter.com/AiBreakfast/status/1667688444095594496?s=20',
            duration: 1
        },
        {
            tweet: 'https://twitter.com/AiBreakfast/status/1666853884122284038?s=20',
            duration: 1
        },
        {
            tweet: 'https://twitter.com/AiBreakfast/status/1665192990208344066?s=20',
            duration: 1
        },
        {
            tweet: 'https://twitter.com/AiBreakfast/status/1652121065194409985?s=20',
            duration: 1
        }
        // {
        //     title: 'What is ShortcutAI?',
        //     subtitle: 'A new way to create shortcuts',
        //     video: vid('https://twitter.com/AiBreakfast/status/1671298165436301312'),
        //     duration: 1
        // },
        // {
        //     title: 'What is ShortcutAI?',
        //     subtitle: 'A new way to create shortcuts',
        //     video: vid('https://twitter.com/AiBreakfast/status/1670950820089589761?s=20'),
        //     duration: 1
        // },
    ]
};

export async function fetchScriptMedia(script: typeof exampleScript) {
    // for each segment fetch video duration
    await Promise.all(script.segments.map(async (segment) => {
        if (segment.tweet) {
            const metadata = await getVideoMetadata(vid(segment.tweet));
            console.log(metadata);
            const maxDuration = 16;
            segment.duration = Math.min(metadata.durationInSeconds, maxDuration);
        } else {
            segment.duration = 4;
        }
    }));

    const totalDuration = script.segments.reduce((acc, segment) => {
        return acc + segment.duration;
    }, 0);

    script.duration = totalDuration;

    return script;
}

function VoiceComp({ text }: { text: string }) {
    const audioUrl = voice(text);
    const audioData = useAudioData(audioUrl);

    // async function fetchData() {
    //     // download audio url
        
    // }

   // return Audio element as react component
    return <Audio src={audioUrl} />;
}

function TweetComp({ url }: { url: string }) {
    const [data, setData] = useState<any | null>(null);
    const [handle] = useState(() => delayRender());

    const fetchData = useCallback(async () => {
        const api = `https://shrtct.ai/api/twitter?url=${url}`;
        console.log(api);

        const res = await fetch(api);
        const data = await res.json();
        setData(data);

        continueRender(handle);
    }, []);

    function text() {
        if (!data) return 'Loading...';
        return data.result[0].text;
    }

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (!data) return null;

    return (
        <AbsoluteFill className="bg-gray-100 items-center justify-center">
            <OffthreadVideo src={vid(url)} volume={0.05} width="100%" />
            <VoiceComp text={text()} />
            {/* <Caption text={text()} /> */}
        </AbsoluteFill>
    );
}

function VideoComp({ url }: { url: string }) {
    return (
        <AbsoluteFill className="bg-gray-100 items-center justify-center">
            <OffthreadVideo src={url} />
            <Title />
            <Subtitle />
        </AbsoluteFill>
    );
}

export const ScriptComp = ({ script }: { script: typeof exampleScript }) => {
    return (
        <AbsoluteFill
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexWrap: "wrap",
                fontSize: 100,
                gap: 0,
                rowGap: 0,
                columnGap: 0,
                backgroundColor: "black"
            }}
        >
            {script.segments.map((segment, index) => {
                const duration = segment.duration;

                // sum all previous segments duration
                const from = script.segments.slice(0, index).reduce((acc, segment) => {
                    return acc + segment.duration;
                }, 0);

                return (
                    <Sequence
                        key={index}
                        from={from * 30}
                        durationInFrames={duration * 30}
                        name={`Segment ${index}`}
                    >
                        {segment.tweet && <TweetComp url={segment.tweet} />}
                        {segment.video && <VideoComp url={segment.video} />}
                    </Sequence>
                );
            }
            )}
        </AbsoluteFill>
    );
};
