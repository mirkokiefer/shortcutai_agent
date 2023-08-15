import {Composition, continueRender, delayRender} from 'remotion';
import {MyComposition} from './compositions/Composition';
import './style.css';
import { MermaidComp } from './components/MermaidComp';
import { ScriptComp, exampleScript, fetchScriptMedia } from './compositions/ScriptComp';
import { useEffect, useState } from 'react';

export const RemotionRoot: React.FC = () => {
	const [handle] = useState(() => delayRender());
	const [duration, setDuration] = useState(1);

	async function fetchData() {
		const updatedScript = await fetchScriptMedia(exampleScript);

		// round up to nearest second
		setDuration(Math.ceil(updatedScript.duration));

		continueRender(handle);
	}

	useEffect(() => {
		fetchData();
	}, [handle]);
  
	return (
		<>
			<Composition
				id="MyComp"
				component={MyComposition}
				durationInFrames={240}
				fps={30}
				// reel style height / width portrait
				width={1024}
				height={1024}
			/>
			<Composition
				id="YT"
				component={ScriptComp}
				defaultProps={{
					script: exampleScript,
				}}
				durationInFrames={duration * 30}
				fps={30}
				width={1920}
				height={1080}
			/>
			<Composition
				id="Mermaid"
				component={MermaidComp}
				durationInFrames={240}
				fps={30}
				// reel style height / width portrait
				width={1024}
				height={1024}
			/>
		</>
	);
};
