'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, X, Hand } from 'lucide-react';
import { 
  GestureRecognizer, 
  FilesetResolver,
  DrawingUtils 
} from '@mediapipe/tasks-vision';

interface WebcamCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export function WebcamCapture({ onCapture, onClose }: WebcamCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [detectedFingers, setDetectedFingers] = useState<number>(0);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [stageCompleted, setStageCompleted] = useState<boolean[]>([false, false, false]);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const gestureRecognizerRef = useRef<GestureRecognizer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastGestureTimeRef = useRef<number>(0);
  const gestureHoldStartRef = useRef<number>(0);
  const videoTimestampRef = useRef<number>(0);
  const currentStageRef = useRef<number>(1);
  const countdownActiveRef = useRef<boolean>(false);
  const requiredHoldTime = 1500;

  useEffect(() => {
    currentStageRef.current = currentStage;
  }, [currentStage]);

  useEffect(() => {
    countdownActiveRef.current = countdown !== null;
  }, [countdown]);

  useEffect(() => {
    initializeMediaPipe();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeMediaPipe = async () => {
    try {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      const gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      gestureRecognizerRef.current = gestureRecognizer;
      setIsModelLoading(false);
      
      // Start webcam
      await startWebcam();
    } catch (error) {
      console.error('Error initializing MediaPipe:', error);
      setIsModelLoading(false);
      alert('Failed to initialize hand gesture detection. Please check your internet connection.');
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          detectGestures();
        };
      }
    } catch (error) {
      console.error('Error accessing webcam:', error);
      alert('Unable to access webcam. Please check your permissions.');
    }
  };

  const detectGestures = () => {
    if (!videoRef.current || !gestureRecognizerRef.current || !canvasRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== 4) {
      animationFrameRef.current = requestAnimationFrame(detectGestures);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    videoTimestampRef.current += 16;
    const results = gestureRecognizerRef.current.recognizeForVideo(video, videoTimestampRef.current);

    if (results.landmarks && results.landmarks.length > 0) {
      const drawingUtils = new DrawingUtils(ctx);
      
      for (const landmarks of results.landmarks) {
        drawingUtils.drawConnectors(
          landmarks,
          GestureRecognizer.HAND_CONNECTIONS,
          { color: '#00FF00', lineWidth: 5 }
        );
        drawingUtils.drawLandmarks(landmarks, {
          color: '#FF0000',
          lineWidth: 2,
          radius: 5
        });
      }

      const fingerCount = countExtendedFingers(results.landmarks[0]);
      setDetectedFingers(fingerCount);

      const currentTime = Date.now();
      const activeStage = currentStageRef.current;
      const isCountdownActive = countdownActiveRef.current;

      if (fingerCount === activeStage && !isCountdownActive) {
        if (gestureHoldStartRef.current === 0) {
          gestureHoldStartRef.current = currentTime;
          console.log(`✅ Stage ${activeStage}: Started holding ${fingerCount} finger(s) at time ${currentTime}`);
        }

        const holdDuration = currentTime - gestureHoldStartRef.current;
        const progress = Math.min(100, (holdDuration / requiredHoldTime) * 100);
        setHoldProgress(progress);
        
        if (Math.floor(holdDuration / 500) !== Math.floor((holdDuration - 16) / 500)) {
          console.log(`⏱️  Stage ${activeStage}: Hold progress ${progress.toFixed(0)}% (${holdDuration}ms / ${requiredHoldTime}ms)`);
        }

        if (holdDuration >= requiredHoldTime) {
          console.log(`🎉 Stage ${activeStage}: COMPLETED! Moving to next stage...`);
          
          setStageCompleted((prev) => {
            const newCompleted = [...prev];
            newCompleted[activeStage - 1] = true;
            return newCompleted;
          });
          
          setHoldProgress(0);
          gestureHoldStartRef.current = 0;
          
          if (activeStage < 3) {
            const nextStage = activeStage + 1;
            console.log(`➡️  Moving from stage ${activeStage} to stage ${nextStage}`);
            
            currentStageRef.current = nextStage;
            setCurrentStage(nextStage);
          } else {
            console.log('🎊 All stages completed! Starting countdown...');
            startCountdown();
          }
        }
      } else {
        if (gestureHoldStartRef.current !== 0) {
          console.log(`❌ Stage ${activeStage}: Reset (detected ${fingerCount} fingers, need ${activeStage})`);
        }
        gestureHoldStartRef.current = 0;
        setHoldProgress(0);
      }
    } else {
      setDetectedFingers(0);
      gestureHoldStartRef.current = 0;
      setHoldProgress(0);
    }

    animationFrameRef.current = requestAnimationFrame(detectGestures);
  };

  const countExtendedFingers = (landmarks: any[]): number => {
    if (!landmarks || landmarks.length !== 21) return 0;

    let count = 0;
    const extendedFingers: string[] = [];

    const thumbTip = landmarks[4];
    const thumbIP = landmarks[3];
    const thumbMCP = landmarks[2];
    
    const wrist = landmarks[0];
    const middleMCP = landmarks[9];
    const isRightHand = middleMCP.x > wrist.x;

    if (isRightHand) {
      if (thumbTip.x > thumbIP.x) {
        count++;
        extendedFingers.push('Thumb');
      }
    } else {
      if (thumbTip.x < thumbIP.x) {
        count++;
        extendedFingers.push('Thumb');
      }
    }

    const fingers = [
      { tip: 8, pip: 6, mcp: 5, name: 'Index' },
      { tip: 12, pip: 10, mcp: 9, name: 'Middle' },
      { tip: 16, pip: 14, mcp: 13, name: 'Ring' },
      { tip: 20, pip: 18, mcp: 17, name: 'Pinky' },
    ];

    for (const finger of fingers) {
      const tip = landmarks[finger.tip];
      const pip = landmarks[finger.pip];
      
      if (tip.y < pip.y) {
        count++;
        extendedFingers.push(finger.name);
      }
    }

    if (Math.random() < 0.03) {
      console.log(`🖐️ Detected ${count} fingers: [${extendedFingers.join(', ')}] | Stage: ${currentStage}`);
    }

    return count;
  };

  const startCountdown = () => {
    setCountdown(3);
    
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          capturePhoto();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    countdownTimerRef.current = interval;
  };

  const cancelCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
  };

  const capturePhoto = useCallback(() => {
    if (!canvasRef.current) return;

    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        onCapture(file);
      }
    }, 'image/jpeg', 0.95);
  }, [onCapture]);

  const manualCapture = () => {
    capturePhoto();
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    if (gestureRecognizerRef.current) {
      gestureRecognizerRef.current.close();
    }
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Camera className="h-6 w-6" />
              Take Photo
            </h2>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="hidden"
            />
            
            <canvas
              ref={canvasRef}
              className="w-full h-auto"
            />

            {isModelLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
                  <p className="text-xl font-semibold">Loading AI Model...</p>
                  <p className="text-sm text-gray-300 mt-2">This may take a few seconds</p>
                </div>
              </div>
            )}

            {countdown !== null && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <div className="text-white text-9xl font-bold animate-pulse">
                  {countdown}
                </div>
              </div>
            )}

            {!isModelLoading && countdown === null && (
              <div className="absolute top-4 left-4 space-y-2">
                <div className="px-4 py-2 rounded-lg bg-blue-600/90 text-white">
                  <span className="font-semibold">
                    Need: {currentStage} finger{currentStage > 1 ? 's' : ''} (Stage {currentStage}/3)
                  </span>
                </div>

                {detectedFingers === currentStage && holdProgress > 0 && (
                  <div className="px-4 py-2 rounded-lg bg-black/70 text-white">
                    <div className="text-xs mb-1">Hold Progress: {Math.round(holdProgress)}%</div>
                    <div className="w-48 h-3 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-100"
                        style={{ width: `${holdProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stage Progress Indicator */}
            {!isModelLoading && countdown === null && (
              <div className="absolute top-20 left-4 bg-black/70 text-white px-4 py-3 rounded-lg">
                <div className="flex gap-3">
                  {[1, 2, 3].map((stage) => (
                    <div key={stage} className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                        stageCompleted[stage - 1] 
                          ? 'bg-green-500 text-white' 
                          : stage === currentStage 
                            ? 'bg-yellow-500 text-black animate-pulse' 
                            : 'bg-gray-500 text-white'
                      }`}>
                        {stageCompleted[stage - 1] ? '✓' : stage}
                      </div>
                      <span className="text-xs mt-1">
                        {stage} finger{stage > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isModelLoading && countdown === null && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-lg text-center max-w-md">
                <p className="font-semibold">Complete 3 stages in order:</p>
                <p className="text-sm text-gray-300 mt-1">1️⃣ Show 1 finger → 2️⃣ Show 2 fingers → 3️⃣ Show 3 fingers</p>
                <p className="text-xs text-yellow-300 mt-2">Hold each gesture for 1 second to complete</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-center">
            <Button 
              onClick={manualCapture} 
              size="lg" 
              className="gap-2"
              disabled={isModelLoading}
            >
              <Camera className="h-5 w-5" />
              Submit
            </Button>
            <Button onClick={handleClose} variant="outline" size="lg">
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
