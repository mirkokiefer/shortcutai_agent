import {AbsoluteFill} from 'remotion';
import {Logo} from '../components/Logo';
import {Subtitle} from '../components/Subtitle';
import {Title} from '../components/Title';

export const MyComposition = () => {
	return (
		<AbsoluteFill className="bg-gray-100 items-center justify-center">
			<div className="m-10" />
			<Logo />
			<div className="m-3" />
			<Title />
			<Subtitle />
		</AbsoluteFill>
	);
};
