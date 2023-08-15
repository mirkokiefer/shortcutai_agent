import { AbsoluteFill } from 'remotion';

import React from "react";
import mermaid from "mermaid";

const example = `
stateDiagram-v2
    [*] --> First
    First --> Second
    First --> Third

    state First {
        [*] --> fir
        fir --> [*]
    }
    state Second {
        [*] --> sec
        sec --> [*]
    }
    state Third {
        [*] --> thi
        thi --> [*]
    }
`;


mermaid.initialize({
  startOnLoad: true,
  theme: "default",
  //   securityLevel: "loose",
  //   themeCSS: `
  //     g.classGroup rect {
  //       fill: #282a36;
  //       stroke: #6272a4;
  //     } 
  //     g.classGroup text {
  //       fill: #f8f8f2;
  //     }
  //     g.classGroup line {
  //       stroke: #f8f8f2;
  //       stroke-width: 0.5;
  //     }
  //     .classLabel .box {
  //       stroke: #21222c;
  //       stroke-width: 3;
  //       fill: #21222c;
  //       opacity: 1;
  //     }
  //     .classLabel .label {
  //       fill: #f1fa8c;
  //     }
  //     .relation {
  //       stroke: #ff79c6;
  //       stroke-width: 1;
  //     }
  //     #compositionStart, #compositionEnd {
  //       fill: #bd93f9;
  //       stroke: #bd93f9;
  //       stroke-width: 1;
  //     }
  //     #aggregationEnd, #aggregationStart {
  //       fill: #21222c;
  //       stroke: #50fa7b;
  //       stroke-width: 1;
  //     }
  //     #dependencyStart, #dependencyEnd {
  //       fill: #00bcd4;
  //       stroke: #00bcd4;
  //       stroke-width: 1;
  //     } 
  //     #extensionStart, #extensionEnd {
  //       fill: #f8f8f2;
  //       stroke: #f8f8f2;
  //       stroke-width: 1;
  //     }`,
  //   fontFamily: "Fira Code"
});

export default class Mermaid extends React.Component {
  componentDidMount() {
    mermaid.contentLoaded();
  }

  render() {
    return <div style={{
      // width: "1000px", 
      // height: "1000px",
    }} className="mermaid">{this.props.chart}</div>;
  }
}


export const MermaidComp = () => {
  return (
    <AbsoluteFill className="bg-gray-100 items-center justify-center">
      <Mermaid chart={example} />
    </AbsoluteFill>
  );
};
