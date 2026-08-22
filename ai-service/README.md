# ✈️ Travel AI - AI Travel Recommendation System

## 📌 Project Overview

Travel AI is an AI-based travel recommendation system that helps users
find suitable travel destinations and hotels according to their travel
preferences.

The system recommends destinations based on:

- State
- Travel Type
- Best Time to Visit
- Destination Popularity

It also allows users to select:

- Check-in Date
- Check-out Date

Based on the selected dates, the system calculates:

- Number of nights
- Hotel price per night
- Total hotel rent

---

## 🚀 Features

### Destination Recommendation

The system recommends the top 5 destinations based on user preferences.

### Hotel Recommendation

Each recommended destination contains a sample hotel name and
hotel price per night.

### Date-based Hotel Cost

Users select their check-in and check-out dates.

The system automatically calculates:

Number of Nights = Check-out Date - Check-in Date

Total Hotel Cost = Hotel Price Per Night × Number of Nights

---

## 🧠 Machine Learning / Data Science

The Data Science component uses:

- Python
- Pandas
- NumPy
- Scikit-learn
- OneHotEncoder
- Cosine Similarity
- Feature Scaling

The recommendation system calculates similarity between the user's
preferences and available destinations and ranks destinations based
on similarity and popularity.

---

## 📊 Dataset

The project uses a destination dataset containing:

- Destination ID
- Destination Name
- State
- Travel Type
- Popularity
- Best Time to Visit
- Hotel Name
- Hotel Price Per Night

Hotel names and prices are sample data for the hackathon prototype.

---

## 🖥️ Running the Project Locally

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL