import VideoPlayer from "./VideoPlayer";
import { CssBaseline, GlobalStyles } from "@mui/material";
function App() {
    const handleNextVid = () => {
        console.log("next video");
    };
    return <>
        <CssBaseline />
        <GlobalStyles
            styles={{
                body: {
                    margin: 0,
                    padding: 0,
                    boxSizing: 'border-box',
                },
            }}
        />
        <VideoPlayer onNext={handleNextVid} />
    </>
}

export default App;