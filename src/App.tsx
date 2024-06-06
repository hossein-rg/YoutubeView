import VideoPlayer from "./VideoPlayer";

function App() {
    const handleNextVid = () => {
        console.log("next video");
    };
    return <VideoPlayer onNext={handleNextVid} />;
}

export default App;