/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react';
import { Button, CircularProgress, Box, Grid, Typography } from '@mui/material';
import axios from 'axios'; // Import axios for making HTTP requests

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

const YoutubePlayer: React.FC<VideoPlayerProps> = ({ onNext }) => {
  const [player, setPlayer] = useState<any>(null);
  const [watchedTime, setWatchedTime] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const playerRef = useRef<any>(null);
  const lastPlayTime = useRef<Date | null>(null);
  const timerRef = useRef<any>(null);
  const [nextStatus, setNextStatus] = useState<boolean>(false);

  useEffect(() => {
    setVideoDetails({ url: 'test', time: 10, id: 'id1' })
    fetchVideoDetails();
  }, []);
  useEffect(() => {
    if (!videoDetails?.time) return
    if (watchedTime >= videoDetails?.time) {
      setNextStatus(true)
      stopVideo();
    }
  }, [watchedTime]);

  const fetchVideoDetails = async () => {
    loadYouTubeIframeAPI('https://www.youtube.com/watch?v=W_MfNQ9cv9M')
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
          height: '360',
          width: '640',
          videoId: videoId,
          events: {
            onStateChange: onPlayerStateChange
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
      if (watchedTime >= Number(videoDetails?.time)) return
      lastPlayTime.current = new Date();
      sendStartTime(); // Send start time to the backend
      startTimer();
    } else if (
      event.data === window.YT.PlayerState.PAUSED ||
      event.data === window.YT.PlayerState.ENDED
    ) {
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
    console.log('stop')
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

  if (!loading) {
    return <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <CircularProgress />
    </Box>
  }

  return (
    <Grid container spacing={2} justifyContent="center" alignItems="center" style={{ height: '100vh' }}>
      <Grid item xs={12} sm={8} md={6} lg={4}>
        <Box position="relative" paddingTop="56.25%">
          <Box position="absolute" top={0} left={0} width="100%" height="100%">
            <div ref={playerRef} style={{ width: '100%', height: '100%' }} />
          </Box>
        </Box>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body1" align="center">Watched: {watchedTime.toFixed()} seconds</Typography>
          <Box display="flex" justifyContent="center" mt={2}>
            {!nextStatus ? (
              <Button disabled variant="contained">
                {videoDetails ? `Next ${videoDetails.time - Number(watchedTime.toFixed())}` : 'Next'}
              </Button>
            ) : (
              <Button variant="contained" color="primary" onClick={onNext}>
                Next
              </Button>
            )}
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export default YoutubePlayer;
