// Helper function to get a cookie value by its name
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
}
const csrftoken = getCookie('csrftoken');

function on(el, event, selector, handler) {
  el.addEventListener(event, e => {
    if (e.target.closest(selector)) handler(e, e.target.closest(selector));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Character counter for new post
  const newPostContent = document.querySelector('#new-post-content');
  const charCount = document.querySelector('.char-count');
  
  if (newPostContent && charCount) {
    newPostContent.addEventListener('input', () => {
      const length = newPostContent.value.length;
      charCount.textContent = `${length}/500`;
      
      // Change color based on character count
      if (length > 450) {
        charCount.style.color = '#E1624F';
      } else if (length > 400) {
        charCount.style.color = '#8E7E6F';
      } else {
        charCount.style.color = '#8E7E6F';
      }
    });
  }
  
// New post form submission
  const form = document.querySelector('#new-post-form');
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const content = document.querySelector('#new-post-content').value.trim();
      if (!content) return;
      
      const body = new FormData();
      body.append('content', content);
      body.append('csrfmiddlewaretoken', csrftoken);
      
      try {
        const res = await fetch('/network/api/posts/', {
          method: 'POST',
          headers: {
            'X-CSRFToken': csrftoken
          },
          body
        });
        
        if (!res.ok) {
          const errorText = await res.text();
          console.error('Error response:', res.status, errorText);
          alert('Failed to post'); 
          return; 
        }
        
        const post = await res.json();
        prependPostToDOM(post);
        document.querySelector('#new-post-content').value = '';
        
        // Reset character counter
        if (charCount) {
          charCount.textContent = '0/500';
          charCount.style.color = '#8E7E6F';
        }
        
        // Trigger AOS animation for new post
        if (typeof AOS !== 'undefined') {
          AOS.refresh();
        }
      } catch (error) {
        console.error('Fetch error:', error);
        alert('Failed to post');
      }
    });
  }

  // Like button
  on(document, 'click', '.like-btn', async (e, btn) => {
    const card = btn.closest('[data-post-id]');
    const id = card.dataset.postId;
    
    const res = await fetch(`/network/api/posts/${id}/like/`, {
      method: 'POST',
      headers: { 'X-CSRFToken': csrftoken }
    });
    
    if (!res.ok) return;
    
    const data = await res.json();
    btn.querySelector('.like-count').textContent = data.likes;
    btn.classList.toggle('liked', data.liked);
  });

  // Edit button
  on(document, 'click', '.edit-btn', (e, btn) => {
    const card = btn.closest('[data-post-id]');
    const p = card.querySelector('.content');
    const original = p.textContent.trim();
    
    const ta = document.createElement('textarea');
    ta.className = 'post-textarea';
    ta.value = original;
    ta.style.minHeight = '100px';
    p.replaceWith(ta);
    ta.focus();

    btn.innerHTML = `
      <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
      </svg>
      Save
    `;
    btn.classList.add('btn-primary-custom');
    btn.classList.remove('action-btn');

    btn.onclick = async () => {
      const newContent = ta.value.trim();
      if (!newContent) return;
      
      const res = await fetch(`/network/api/posts/${card.dataset.postId}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrftoken
        },
        body: JSON.stringify({ content: newContent })
      });
      
      if (!res.ok) { 
        alert('Edit failed'); 
        return; 
      }
      
      const updated = await res.json();
      const pNew = document.createElement('p');
      pNew.className = 'content';
      pNew.textContent = updated.content;
      ta.replaceWith(pNew);
      
      btn.innerHTML = `
        <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
        </svg>
        Edit
      `;
      btn.classList.remove('btn-primary-custom');
      btn.classList.add('action-btn');
      btn.onclick = null;
    };
  });

  // Follow button
  const followBtn = document.querySelector("#follow-btn");
  if (followBtn) {
    followBtn.addEventListener("click", async () => {
      const username = followBtn.dataset.username;

      const res = await fetch(`/network/api/follow/${username}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": csrftoken,
        },
      });
      
      if (!res.ok) return;

      const data = await res.json();

      // Update button style and text
      if (data.following) {
        followBtn.innerHTML = `
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
          Following
        `;
        followBtn.classList.remove("btn-primary-custom");
        followBtn.classList.add("btn-secondary-custom");
      } else {
        followBtn.innerHTML = `
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd"/>
          </svg>
          Follow
        `;
        followBtn.classList.remove("btn-secondary-custom");
        followBtn.classList.add("btn-primary-custom");
      }

      // Update followers count
      const followersCount = document.querySelector("#followers-count");
      if (followersCount) followersCount.textContent = data.followers_count;
      
      // Update following count
      const followingCount = document.querySelector("#following-count");
      if (followingCount) followingCount.textContent = data.following_count;
    });
  }

  // Function to prepend new post to DOM
  function prependPostToDOM(post) {
    const list = document.querySelector('#posts');
    if (!list) return;
    
    const card = document.createElement('div');
    card.className = 'post-card';
    card.dataset.postId = post.id;
    card.setAttribute('data-aos', 'fade-up');
    
    card.innerHTML = `
      <div class="post-header">
        <div class="post-author">
          <a href="/profile/${post.author}/" class="author-avatar">
            ${post.author.charAt(0).toUpperCase()}
          </a>
          <div class="author-info">
            <a href="/profile/${post.author}/" class="author-name">@${post.author}</a>
            <span class="post-time">just now</span>
          </div>
        </div>
      </div>
      <div class="post-content">
        <p class="content"></p>
      </div>
      <div class="post-actions">
        <button class="action-btn like-btn">
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
          </svg>
          <span class="like-count">${post.likes}</span>
        </button>
        ${post.editable ? `
          <button class="action-btn edit-btn">
            <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
            </svg>
            Edit
          </button>
        ` : ''}
      </div>
    `;
    
    card.querySelector('.content').textContent = post.content;
    list.prepend(card);
  }
});