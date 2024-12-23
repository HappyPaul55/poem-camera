# Poem Camera
The Poem Camera is a webapp that doesn't take photos like other cameras, but instead takes poems of what it sees. Think of it like a Polaroid but instead of instant photos, it's instant poems.

## Features
These are just current ones, feel free to create your own - make a PR...

### Multiple Camera Support
Like your native camera app, you can toggle all connected cameras.

### Thermal Printer Support
Can connect via Bluetooth, Serial or USB and print the poems isntantly - it's like a Polaroid, but with words!

### Native Printer Support
Print to PDF or actual printers as it has built in printer friendly styles - no wasted ink!

### File Upload Support
Maybe you don't want to give permissions to the website, and that's fine. Instead you can use the File Upload feature and it will make a poem from that picture as-if you took it right here right now from the web app.

## Developers

### Start the project
Make sure you have a `.env.local` file with `XAI_API_KEY={YOUR API KEY}`, `MISTRAL_API_KEY={YOUR API KEY}` or both.
First, run `pnpm dev` then go to [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Credits
I came up with this idea whilst messing with a thermal printer, however after some research I did [find this project by carolynz](https://github.com/carolynz/poetry-camera-rpi) - please read, it's well documented. I wanted to make my own version but I'm not very good with low level software and wanted to keep the solution as non-techncal as possible from a hardware point of view. My design goals was to smash an old Android device and a thermal printer into one and go from there. The advantages been better camera quality (as even old Android devices tend to have great cameras), ease of development (which is subjective as I'm a web developer by day) and fewer moving parts (the Android device has WiFi, 4G - or better, cameras, screens and more all in one package).