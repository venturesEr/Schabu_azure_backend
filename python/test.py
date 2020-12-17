# code 
import sys
import azure.cognitiveservices.speech as speechsdk
from azure.cognitiveservices.speech import AudioDataStream, SpeechConfig, SpeechSynthesizer, SpeechSynthesisOutputFormat
from azure.cognitiveservices.speech.audio import AudioOutputConfig
import time
from random import random

name = sys.argv[1];

def welcome_message(name):
  speech_config = speechsdk.SpeechConfig(subscription="b58d19e457574aa39bc0f8b9b763cd55", region="australiaeast")
  audio_config = AudioOutputConfig(filename="C:/Users/Pranav Patel/Documents/schabu/back_end/python/welcome.wav")
  synthesizer = SpeechSynthesizer(speech_config=speech_config, audio_config=audio_config)
  text = "Hello " + name + "! Welcome to Schubu Recrutiment Process. Please Click on the Start button to begin the interview process."
  synthesizer.speak_text_async(text)
  print(text)

welcome_message(name)