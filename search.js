// WTCraft 网站搜索功能
document.addEventListener('DOMContentLoaded', function() {
    // 1. 创建搜索框HTML并插入到导航栏
    const navContainer = document.querySelector('#nav-main > div');
    if (navContainer) {
        const searchHTML = `
            <!-- 搜索框 -->
            <div class="relative flex items-center mr-4">
                <input type="text" id="searchInput" placeholder="搜索页面内容..." 
                       class="data-card px-4 py-2 text-inherit text-sm outline-none rounded-full w-40 focus:w-56 transition-all duration-300 border border-transparent focus:border-pink-400 bg-opacity-50">
                <button onclick="performSearch()" class="absolute right-3 text-inherit hover:text-pink-400">
                    <i class="fa-solid fa-search text-sm"></i>
                </button>
            </div>
        `;
        // 在主题切换按钮前插入搜索框
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.insertAdjacentHTML('beforebegin', searchHTML);
        }
    }

    // 2. 搜索功能实现
    window.performSearch = function() {
        const searchTerm = document.getElementById('searchInput').value.trim().toLowerCase();
        if (!searchTerm) {
            alert('请输入搜索内容！');
            return;
        }
        
        const searchableContent = [
            { text: 'zdy.wtstu.us.ci', section: 'card-main-server', label: '主服务器地址' },
            { text: 'wtstu.owo.vin', section: 'card-mini-server', label: '小游戏服地址' },
            { text: '纯净生存', section: 'server-card-survival', label: '纯净生存服务器' },
            { text: '小游戏', section: 'server-card-minigame', label: '小游戏服务器' },
            { text: 'PCL', section: 'server-card-java', label: 'PCL启动器' },
            { text: '服务器介绍', section: 'server-intro', label: '服务器介绍' },
            { text: '服务器列表', section: 'server-list', label: '服务器列表' },
            { text: '图册', section: 'gallery', label: '风景图册' },
            { text: '公告', section: '', label: '游戏公告' },
        ];
        
        const matches = searchableContent.filter(item => item.text.toLowerCase().includes(searchTerm));
        
        if (matches.length > 0) {
            if (matches[0].section) {
                const section = document.getElementById(matches[0].section);
                if (section) {
                    const navHeight = 100;
                    const sectionTop = section.getBoundingClientRect().top + window.pageYOffset - navHeight;
                    window.scrollTo({ top: sectionTop, behavior: 'smooth' });
                    
                    // 高亮效果
                    section.style.boxShadow = '0 0 20px rgba(255, 107, 157, 0.8)';
                    setTimeout(() => {
                        section.style.boxShadow = '';
                    }, 2000);
                    
                    alert(`找到"${matches[0].label}"，已跳转到对应区域！`);
                }
            } else {
                alert(`找到"${matches[0].label}"！该内容在页面多处出现。`);
            }
        } else {
            alert('未找到匹配内容！\n\n可搜索：服务器地址、纯净生存、小游戏、PCL、服务器介绍、服务器列表、图册等');
        }
    };

    // 3. 回车键搜索
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    }
});