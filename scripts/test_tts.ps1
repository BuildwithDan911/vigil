Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SetOutputToWaveFile("c:\Users\USER\Downloads\vigil-build-kit (1)\vigil\test_voice.wav")
$synth.Speak("Vigil for IRIS for Health: Autonomous Clinical Patient Safety Handoff Engine.")
$synth.Dispose()
Write-Host "TTS Audio Generated Successfully"
