import { getInputProps, interpolate } from 'remotion';
import { useCurrentFrame } from 'remotion';
import React from 'react';

export const Thumbnail: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [20, 40], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const inputProps = getInputProps();
	const title = inputProps.title || 'Welcome to ShortcutAI';

	return (
		<div
			style={{ opacity }}
			className="text-gray-700 text-5xl font-bold leading-relaxed"
		>
			{title}
		</div>
	);
};
