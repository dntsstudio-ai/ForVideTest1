window.saveSettings = () => {
    const name = document.getElementById('set_name').value;
    const bio = document.getElementById('set_bio').value;
    const currentUid = localStorage.getItem('fv_current_uid');
    
    let accounts = JSON.parse(localStorage.getItem('fv_accounts') || '[]');
    const index = accounts.findIndex(a => a.uid === currentUid);
    
    if (index !== -1) {
        accounts[index].name = name;
        accounts[index].bio = bio;
        localStorage.setItem('fv_accounts', JSON.stringify(accounts));
        window.showToast('Настройки сохранены! 🛸', 'success');
    }
};
