# SkillTube Backend Documentation

This document will help you understand the backend part of the SkillTube project.

## Project Overview
SkillTube is a video platform similar to YouTube Shorts. This backend manages all the data and business rules, such as user accounts, video uploads, playlists, comments, and saving videos. I built it using Node.js and Express.

## Tech Stack
These are the main tools we use:
- **Node.js & Express**: Runs the server and handles incoming requests from the frontend.
- **PostgreSQL**: A powerful relational database that stores all our text and numbers (users, video links, comments).
- **Cloudinary**: A cloud service we use to store large files like videos and images. Our database only keeps the links (URLs) to these files.
- **JSON Web Tokens (JWT)**: Used for keeping users logged in securely. Let us know who is making a request.
- **Multer**: A tool to handle file uploads before we send them to Cloudinary.

## Database Explained
We keep our data clean and connected using tables. Here is what you need to know about them:
- **app_user**: Stores the user details. Users log in through their phone numbers using OTP (One Time Passwords).
- **otp_verification**: A temporary table that stores passcodes to check if a user is who they claim to be.
- **playlist**: Stores folders of videos. A playlist has a name, a thumbnail, and a category.
- **video**: Stores details of every single video. Each video must belong to a playlist. It tracks views, likes, and dislikes.
- **comment**: Stores user feedback on videos.
- **user_video_reaction**: Tracks whether a specific user liked or disliked a specific video.
- **bookmark**: Tracks which videos a user has saved to watch later.

All these tables are defined in `model/schema.js`. Take a look there if you want to see the exact structure.

## How the Code is Organized
The folders inside this project make it easy to find where things happen.

- **routes/**: This is where we create URLs (like `/api/videos`). When the frontend asks for something, it comes here first. The route then calls a specific controller.
- **controllers/**: This is where the actual logic lives. If a user asks for all videos, the video controller goes to the database, gets the videos, and sends them back. Look in `videoRouter.js` and you will see it calls things from the controllers folder.
- **middlewares/**: Think of these as security guards. For example, `authMiddleware.js` checks if a user is logged in before letting them upload a video or leave a comment.
- **model/**: Contains our database setup.
- **jobs/**: These are tasks that run on a schedule behind the scenes. For example, one job deletes old OTP codes so the database doesn't get full of junk data.
- **services/** & **util/**: Small helper files for talking to Cloudinary or connecting to the database.

## System Risks and Things to Look Out For
Before you start coding, keep these risks in mind.
- **Database Limits**: If the database grows too large, queries might slow down. We have indexes on commonly searched items (like active videos), but we need to monitor performance under heavy traffic.
- **File Upload Errors**: Sometimes an upload to Cloudinary might fail halfway. The system needs to safely handle these errors so the app doesn't crash or save half-broken links.
- **Security**: The OTP authentication depends on keeping the codes secret. Make sure you don't log OTP codes into the terminal by accident.

## How to Get Started Locally
To run this code on your computer:
1. Make sure you have Node.js installed.
2. Open your terminal in the `SkillTube-backend` folder.
3. Add a `.env` file with your database and Cloudinary secrets. 
4. Run `npm install` to download all the needed parts.
5. Run `npm run dev` to start the server. You will see a message saying the server is running on localhost.