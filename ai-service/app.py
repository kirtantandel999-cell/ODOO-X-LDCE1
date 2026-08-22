import streamlit as st
import pandas as pd
import numpy as np
import joblib

from sklearn.metrics.pairwise import cosine_similarity
from datetime import date


# =====================================================
# PAGE CONFIGURATION
# =====================================================

st.set_page_config(
    page_title="AI Travel Planner",
    page_icon="✈️",
    layout="wide"
)


# =====================================================
# LOAD DATA
# =====================================================

df = pd.read_csv(
    "Expanded_Destinations.csv"
)


encoder = joblib.load(
    "destination_encoder.pkl"
)


scaler = joblib.load(
    "popularity_scaler.pkl"
)


# =====================================================
# FEATURES
# =====================================================

categorical_columns = [
    "State",
    "Type",
    "BestTimeToVisit"
]


# =====================================================
# RECOMMENDATION FUNCTION
# =====================================================

def recommend_destinations(
    state,
    place_type,
    best_time,
    top_n=5
):

    # ---------------------------------------------
    # User input
    # ---------------------------------------------

    user_data = pd.DataFrame({
        "State": [state],
        "Type": [place_type],
        "BestTimeToVisit": [best_time]
    })


    # ---------------------------------------------
    # Encode user input
    # ---------------------------------------------

    user_cat = encoder.transform(
        user_data[categorical_columns]
    )


    # Popularity neutral value
    user_popularity = np.array([
        [0]
    ])


    # Combine features
    user_vector = np.hstack([
        user_cat,
        user_popularity
    ])


    # ---------------------------------------------
    # Encode all destinations
    # ---------------------------------------------

    all_cat = encoder.transform(
        df[categorical_columns]
    )


    all_popularity = scaler.transform(
        df[["Popularity"]]
    )


    all_features = np.hstack([
        all_cat,
        all_popularity
    ])


    # ---------------------------------------------
    # Calculate similarity
    # ---------------------------------------------

    similarities = cosine_similarity(
        user_vector,
        all_features
    )[0]


    # ---------------------------------------------
    # Create result
    # ---------------------------------------------

    result = df.copy()


    result["Similarity"] = similarities


    # ---------------------------------------------
    # Final score
    # ---------------------------------------------

    result["FinalScore"] = (
        0.7 * result["Similarity"]
        +
        0.3 * (
            result["Popularity"]
            / df["Popularity"].max()
        )
    )


    # Highest score first

    result = result.sort_values(
        "FinalScore",
        ascending=False
    )


    return result.head(top_n)


# =====================================================
# APP HEADER
# =====================================================

st.title(
    "✈️ AI Travel Recommendation System"
)

st.write(
    "Find your ideal destination and hotel "
    "according to your travel preferences."
)


st.divider()


# =====================================================
# TRAVEL PREFERENCES
# =====================================================

st.header(
    "🌍 Select Your Travel Preferences"
)


col1, col2 = st.columns(2)


with col1:

    state = st.selectbox(
        "📍 Select State",
        sorted(
            df["State"].unique()
        )
    )


    place_type = st.selectbox(
        "🏖️ Travel Type",
        sorted(
            df["Type"].unique()
        )
    )


with col2:

    best_time = st.selectbox(
        "🌤️ Best Time to Visit",
        sorted(
            df["BestTimeToVisit"].unique()
        )
    )


# =====================================================
# HOTEL BOOKING DATES
# =====================================================

st.header(
    "🏨 Hotel Booking Details"
)


date_col1, date_col2 = st.columns(2)


with date_col1:

    check_in = st.date_input(
        "📅 Check-in Date",
        value=date.today(),
        min_value=date.today()
    )


with date_col2:

    check_out = st.date_input(
        "📅 Check-out Date",
        value=date.today(),
        min_value=date.today()
    )


# =====================================================
# CALCULATE NIGHTS
# =====================================================

number_of_nights = (
    check_out - check_in
).days


if number_of_nights > 0:

    st.info(
        f"🌙 Total Nights: "
        f"**{number_of_nights}**"
    )

elif number_of_nights == 0:

    st.warning(
        "⚠️ Check-in and Check-out "
        "cannot be the same date."
    )

else:

    st.error(
        "❌ Check-out date must be "
        "after Check-in date."
    )


# =====================================================
# RECOMMEND BUTTON
# =====================================================

st.write("")


if st.button(
    "🔍 Find My Best Trip",
    type="primary",
    use_container_width=True
):

    # ---------------------------------------------
    # Validate dates
    # ---------------------------------------------

    if number_of_nights <= 0:

        st.error(
            "Please select valid "
            "Check-in and Check-out dates."
        )

        st.stop()


    # ---------------------------------------------
    # Get recommendations
    # ---------------------------------------------

    recommendations = recommend_destinations(
        state=state,
        place_type=place_type,
        best_time=best_time,
        top_n=5
    )


    st.success(
        "🎉 Your travel recommendations are ready!"
    )


    st.divider()


    # =================================================
    # RESULTS
    # =================================================

    st.header(
        "🏆 Top Recommended Destinations"
    )


    for rank, (_, row) in enumerate(
        recommendations.iterrows(),
        start=1
    ):


        # ---------------------------------------------
        # Destination title
        # ---------------------------------------------

        st.subheader(
            f"{rank}. 📍 {row['Name']}"
        )


        # ---------------------------------------------
        # Destination information
        # ---------------------------------------------

        info_col1, info_col2 = st.columns(2)


        with info_col1:

            st.write(
                f"**📍 State:** "
                f"{row['State']}"
            )

            st.write(
                f"**🏖️ Type:** "
                f"{row['Type']}"
            )


        with info_col2:

            st.write(
                f"**⭐ Popularity:** "
                f"{row['Popularity']:.2f}"
            )

            st.write(
                f"**🌤️ Best Time:** "
                f"{row['BestTimeToVisit']}"
            )


        # ---------------------------------------------
        # HOTEL
        # ---------------------------------------------

        st.markdown(
            "### 🏨 Recommended Hotel"
        )


        hotel_col1, hotel_col2, hotel_col3 = st.columns(3)


        with hotel_col1:

            st.write(
                f"**Hotel Name**"
            )

            st.write(
                f"🏨 {row['HotelName']}"
            )


        with hotel_col2:

            hotel_price = int(
                row["HotelPricePerNight"]
            )

            st.write(
                f"**Price Per Night**"
            )

            st.write(
                f"💰 ₹{hotel_price:,}"
            )


        with hotel_col3:

            total_cost = (
                hotel_price
                * number_of_nights
            )

            st.write(
                f"**Total Hotel Cost**"
            )

            st.write(
                f"💵 ₹{total_cost:,}"
            )


        # ---------------------------------------------
        # BOOKING SUMMARY
        # ---------------------------------------------

        st.info(
            f"""
📅 **Check-in:** {check_in}

📅 **Check-out:** {check_out}

🌙 **Number of Nights:** {number_of_nights}

🏨 **Hotel:** {row['HotelName']}

💰 **Price/Night:** ₹{hotel_price:,}

💵 **Total Hotel Rent:** ₹{total_cost:,}
"""
        )


        st.divider()