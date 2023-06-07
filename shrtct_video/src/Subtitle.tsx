import React from 'react';
import { getInputProps, interpolate, useCurrentFrame } from 'remotion';

export const Subtitle: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [30, 50], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const inputProps = getInputProps();
	const subtitle = inputProps.subtitle || 'Your subtitle.';

	return (
		<div className="text-gray-600 text-4xl" style={{ opacity }}>
			{subtitle}
		</div>
	);
};
