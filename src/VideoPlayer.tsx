/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
import { Button, CircularProgress, Box, Grid } from '@mui/material';
import { styled, keyframes } from '@mui/system';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: any;
  }
}

// interfaces
interface VideoPlayerProps {
  onNext: () => void;
}

interface VideoDetails {
  url: string;
  time: number;
  id: string;
}

const progressBarKeyframes = keyframes`
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
`;

const shakeKeyframes = keyframes`
  0% { transform: rotate(0); }
  25% { transform: rotate(-3deg); }
  50% { transform: rotate(3deg); }
  75% { transform: rotate(-3deg); }
  100% { transform: rotate(0); }
`;

const ProgressContainer = styled('div')({
  position: 'absolute',
  top: 0,
  left: 0,
  height: '5px',
  width: '100%',
  backgroundColor: 'rgba(0, 0, 0, 0.1)',
});

const ProgressBar = styled('div')<{
  duration: number;
  isPlaying: boolean;
}>(({ duration, isPlaying }) => ({
  height: '100%',
  backgroundColor: '#FF0000',
  animationName: progressBarKeyframes,
  animationTimingFunction: 'linear',
  animationDuration: `${duration}s`,
  animationPlayState: isPlaying ? 'running' : 'paused',
  animationFillMode: 'forwards',
}));

const ShakingButton = styled(Button)<{ shake: boolean }>(({ shake }) => ({
  ...(shake && {
    animation: `${shakeKeyframes} 0.5s 4`,
  }),
}));

const YoutubePlayer: React.FC<VideoPlayerProps> = ({ onNext }) => {
  const [player, setPlayer] = useState<any>(null);
  const [watchedTime, setWatchedTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const playerRef = useRef<any>(null);
  const lastPlayTime = useRef<Date | null>(null);
  const timerRef = useRef<any>(null);
  const [nextStatus, setNextStatus] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    setVideoDetails({ url: 'test', time: 10, id: 'id1' });
    fetchVideoDetails();
  }, []);

  useEffect(() => {
    if (!videoDetails?.time) return;
    if (watchedTime >= videoDetails?.time) {
      setNextStatus(true);
      stopVideo();
    }
  }, [watchedTime]);

  const fetchVideoDetails = async () => {
    loadYouTubeIframeAPI('https://www.youtube.com/watch?v=W_MfNQ9cv9M');
  };

  const loadYouTubeIframeAPI = (videoUrl: string) => {
    const videoId = getYouTubeVideoId(videoUrl);
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = () => {
      setPlayer(
        new window.YT.Player(playerRef.current, {
          videoId: videoId,
          events: {
            onStateChange: onPlayerStateChange,
          },
        }),
      );
    };
  };

  const getYouTubeVideoId = (url: string) => {
    const urlObj = new URL(url);
    return urlObj.searchParams.get('v') || urlObj.search.split('?v=')[1];
  };

  const onPlayerStateChange = (event: any) => {
    if (event.data === window.YT.PlayerState.PLAYING) {
      if (watchedTime >= Number(videoDetails?.time)) return;
      setIsPlaying(true);
      lastPlayTime.current = new Date();
      sendStartTime(); // Send start time to the backend
      startTimer();
    } else if (
      event.data === window.YT.PlayerState.PAUSED ||
      event.data === window.YT.PlayerState.ENDED
    ) {
      setIsPlaying(false);
      if (lastPlayTime.current) {
        const watched = (new Date().getTime() - lastPlayTime.current.getTime()) / 1000;
        setWatchedTime((prevWatchedTime) => {
          const newWatchedTime = prevWatchedTime;
          stopVideo();
          sendStopTime(watched);
          return newWatchedTime;
        });
      }
      // stopTimer();
    }
  };

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setWatchedTime((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopVideo = () => {
    if (player) {
      player.pauseVideo();
    }
    stopTimer();
  };

  const sendStartTime = () => {
    localStorage.setItem('setStartVideo', String(lastPlayTime.current));
  };

  const sendStopTime = (time: number) => {
    localStorage.setItem('watchTimeAfterStart', String(time));
  };

  const getAnimationDuration = () => {
    return videoDetails ? videoDetails.time : 0;
  };

  if (!loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Box position="relative" width="100%" mt={2}>
        <ProgressContainer>
          <ProgressBar duration={getAnimationDuration()} isPlaying={isPlaying} />
        </ProgressContainer>
      </Box>
      <Grid container height="100vh" spacing={2} justifyContent="center" alignItems="center" >
        <Grid item xs={12} lg={8}>
          <Box
            position="relative"
            sx={{
              paddingTop: '56.25%',
              '@media (max-width:600px)': {
                paddingTop: '100%',
              },
            }}
          >
            <Box position="absolute" top={0} left={0} width="100%" height="100%">
              <div ref={playerRef} style={{ width: '100%', height: '100%' }} />
            </Box>
          </Box>
          <Box display="flex" justifyContent="center">
            <Box display="flex" justifyContent="center" alignItems="center" mt={2}>
              {!nextStatus ? (
                <ShakingButton disabled color='success' variant="contained" shake={false}>
                  {videoDetails ? `Next ${videoDetails.time - Number(watchedTime.toFixed())}` : 'Next'}
                </ShakingButton>
              ) : (
                <ShakingButton
                  variant="outlined"
                  color="primary"
                  onClick={onNext}
                  shake={nextStatus}
                >
                  Next
                </ShakingButton>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </>
  );
};

export default YoutubePlayer;
