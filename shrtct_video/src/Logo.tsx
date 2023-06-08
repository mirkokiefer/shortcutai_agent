import React from 'react';
import { Img, getInputProps, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

export const Logo: React.FC = () => {
	const frame = useCurrentFrame();
	const { height, width, fps } = useVideoConfig();
	let logoUrl = getInputProps().logo;

	if (logoUrl === undefined || logoUrl.indexOf('http') === -1) {
		logoUrl ='https://shrtct.ai/logo.png';
	}

	const entrance = spring({
		fps,
		frame,
		config: {
			damping: 200,
		},
		durationInFrames: 30,
	});

	const entranceOffset = interpolate(entrance, [0, 1], [height, 0]);

	const wave1 = Math.cos(frame / 15) * 10 + entranceOffset;

	return (
		<div>
			<div
				style={{
					transform: `translateY(${-wave1}px)`,
				}}
			>
				<Img
					style={{
						height: width / 2,
						width: width / 2,
						borderRadius: width / 2 / 2,
						// aspect fill
						objectFit: 'cover',
					}}
					src={logoUrl} />
			</div>
		</div>
	);
};
