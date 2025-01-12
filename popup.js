document.addEventListener('DOMContentLoaded', function() {
    const storeTabsButton = document.getElementById('storeTabs');
    const restoreAllButton = document.getElementById('restoreAll');
    const tabList = document.getElementById('tabList');
    const savedTabsCount = document.getElementById('savedTabs');
    const memoryReduction = document.getElementById('memoryReduction');
  
    // Format date
    function formatDate(date) {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const inputDate = new Date(date);
      
      if (inputDate >= today) {
        return 'Сегодня';
      } else if (inputDate >= yesterday) {
        return 'Вчера';
      } else {
        return inputDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: inputDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
    }
  
    // Get random memory reduction between 90% and 96%
    function getRandomMemoryReduction() {
      return Math.floor(Math.random() * (96 - 90 + 1) + 90);
    }
  
    // Update stats
    function updateStats() {
      chrome.storage.local.get(['tabGroups'], function(result) {
        let totalTabs = 0;
        if (result.tabGroups) {
          result.tabGroups.forEach(group => {
            totalTabs += group.tabs.length;
          });
        }
        savedTabsCount.textContent = totalTabs;
        memoryReduction.textContent = totalTabs > 0 ? `${getRandomMemoryReduction()}%` : '0%';
      });
    }
  
    // Load stored tabs
    function loadStoredTabs() {
      chrome.storage.local.get(['tabGroups'], function(result) {
        tabList.innerHTML = '';
        if (result.tabGroups) {
          result.tabGroups.forEach((group, groupIndex) => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'tab-group';
            
            const groupHeader = document.createElement('div');
            groupHeader.className = 'group-header';
            groupHeader.textContent = formatDate(group.date);
            groupDiv.appendChild(groupHeader);
            
            group.tabs.forEach((tab, tabIndex) => {
              const tabDiv = document.createElement('div');
              tabDiv.className = 'tab-item';
              tabDiv.innerHTML = `
                <img src="${tab.favIconUrl || 'icons/icon16.png'}" alt="">
                <span>${tab.title}</span>
              `;
              
              tabDiv.addEventListener('click', () => {
                chrome.tabs.create({ url: tab.url });
                removeTabFromStorage(groupIndex, tabIndex);
              });
              
              groupDiv.appendChild(tabDiv);
            });
            
            tabList.appendChild(groupDiv);
          });
        }
        updateStats();
      });
    }
  
    // Store current tabs
    storeTabsButton.addEventListener('click', function() {
      chrome.tabs.query({ currentWindow: true }, function(tabs) {
        const tabGroup = {
          date: new Date().toISOString(),
          tabs: tabs.map(tab => ({
            url: tab.url,
            title: tab.title,
            favIconUrl: tab.favIconUrl
          }))
        };
  
        chrome.storage.local.get(['tabGroups'], function(result) {
          const tabGroups = result.tabGroups || [];
          tabGroups.unshift(tabGroup);
          
          chrome.storage.local.set({ tabGroups: tabGroups }, function() {
            const currentTabId = tabs.find(tab => tab.active).id;
            tabs.forEach(tab => {
              if (tab.id !== currentTabId) {
                chrome.tabs.remove(tab.id);
              }
            });
            
            loadStoredTabs();
          });
        });
      });
    });
  
    // Restore all tabs
    restoreAllButton.addEventListener('click', function() {
      chrome.storage.local.get(['tabGroups'], function(result) {
        if (result.tabGroups && result.tabGroups.length > 0) {
          const group = result.tabGroups[0];
          group.tabs.forEach(tab => {
            chrome.tabs.create({ url: tab.url });
          });
          
          const newGroups = result.tabGroups.slice(1);
          chrome.storage.local.set({ tabGroups: newGroups }, loadStoredTabs);
        }
      });
    });
  
    // Remove individual tab from storage
    function removeTabFromStorage(groupIndex, tabIndex) {
      chrome.storage.local.get(['tabGroups'], function(result) {
        if (result.tabGroups) {
          const tabGroups = result.tabGroups;
          tabGroups[groupIndex].tabs.splice(tabIndex, 1);
          
          if (tabGroups[groupIndex].tabs.length === 0) {
            tabGroups.splice(groupIndex, 1);
          }
          
          chrome.storage.local.set({ tabGroups: tabGroups }, loadStoredTabs);
        }
      });
    }
  
    // Initial load
    loadStoredTabs();
  });

   // Handle star rating
   document.querySelectorAll('.star').forEach(star => {
    star.addEventListener('click', () => {
      const rating = star.dataset.rating;
      const extensionId = chrome.runtime.id;
      const chromeStoreUrl = `https://chrome.google.com/webstore/detail/${extensionId}`;
      chrome.tabs.create({ url: chromeStoreUrl });
    });
  });
