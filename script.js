const userId = "1196575558964887644";
const statusElement = document.getElementById("status");
const spotifyContainer = document.getElementById("spotify-container");

const ws = new WebSocket("wss://api.lanyard.rest/socket");
let heartbeat = null;

ws.onopen = () => {
    ws.send(
        JSON.stringify({
            op: 2,
            d: {
                subscribe_to_id: userId,
            },
        })
    );
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    switch (data.op) {
        case 1:
            heartbeat = setInterval(() => {
                ws.send(
                    JSON.stringify({
                        op: 3,
                    })
                );
            }, data.d.heartbeat_interval);
            break;

        case 0:
            updateStatus(data.d);
            startAnimations(); // Start animations after first data load
            break;
    }
};

ws.onclose = () => {
    if (heartbeat) clearInterval(heartbeat);
};

function updateStatus(data) {
    if (!data || !data.discord_status) return;

    // Update user profile
    const userProfile = document.getElementById('user-profile');
    if (data.discord_user) {
        const avatarHash = data.discord_user.avatar;
        const avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}`;
        userProfile.innerHTML = `
            <div class="profile-header">
                <img class="user-avatar" src="${avatarUrl}" alt="Profile Picture">
                <div class="user-info">
                    <div class="display-name">${data.discord_user.display_name || data.discord_user.username}</div>
                    <div class="username">@${data.discord_user.username}</div>
                    <div class="status-wrapper">
                        <span class="status-dot ${data.discord_status}"></span>
                        ${data.discord_status.charAt(0).toUpperCase() + data.discord_status.slice(1)}
                    </div>
                </div>
            </div>
        `;
    }

    // Handle Activities and Spotify
    const activitiesContainer = document.getElementById('activities-container');
    const activityLabel = document.querySelector('.activity-label');
    const separator = document.querySelector('.separator');
    activitiesContainer.innerHTML = '';

    const hasActivities = (data.spotify || (data.activities && data.activities.length > 0));
    activityLabel.style.display = hasActivities ? 'block' : 'none';
    separator.style.marginBottom = hasActivities ? '10px' : '0';

    // Add Spotify first if playing
    if (data.spotify) {
        const { album_art_url, song, artist, track_id } = data.spotify;
        const spotifyEl = document.createElement('div');
        spotifyEl.className = 'activity-card spotify-card';
        spotifyEl.onclick = () => {
            window.open(`https://open.spotify.com/track/${track_id}`, '_blank');
        };
        spotifyEl.innerHTML = `
            <img class="activity-image" src="${album_art_url}" alt="Album Art">
            <div class="activity-info">
                <strong>Spotify</strong>
                <span>${song}</span>
                <span>${artist}</span>
            </div>
        `;
        activitiesContainer.appendChild(spotifyEl);
    }

    // Add other activities
    if (data.activities && data.activities.length > 0) {
        data.activities.forEach(activity => {
            if (activity.type === 2) return; // Skip Spotify activity as it's handled above

            let imageUrl = '';
            if (activity.application_id) {
                imageUrl = `https://cdn.discordapp.com/app-assets/${activity.application_id}/${activity.assets?.large_image}.png`;
            }

            const activityEl = document.createElement('div');
            activityEl.className = 'activity-card';
            activityEl.innerHTML = `
                ${imageUrl ? `<img class="activity-image" src="${imageUrl}" alt="${activity.name}">` : ''}
                <div class="activity-info">
                    <strong>${activity.name}</strong>
                    ${activity.details ? `<span>${activity.details}</span>` : ''}
                    ${activity.state ? `<span>${activity.state}</span>` : ''}
                </div>
            `;
            activitiesContainer.appendChild(activityEl);
        });
    }
}

function startAnimations() {
    const preloader = document.querySelector('.preloader');
    const container = document.getElementById('status-container');
    
    preloader.classList.add('hidden');
    container.classList.remove('content-hidden');
}
