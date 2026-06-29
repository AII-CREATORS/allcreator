/**
 * ToastManager.js
 * 토스트 알림 유틸리티
 * 사용: ToastManager.success('메시지') / ToastManager.error('메시지')
 */

ToastManager = class ToastManager
{
    static show(message, type, duration)
    {
        if (!type) type = 'info';
        if (!duration) duration = 3000;

        var container = document.querySelector('.ac-toast-container');
        if (!container)
        {
            container = document.createElement('div');
            container.className = 'ac-toast-container';
            document.body.appendChild(container);
        }

        var toast = document.createElement('div');
        toast.className = 'ac-toast ' + type;
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(function()
        {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, duration);
    }

    static success(msg) { ToastManager.show(msg, 'success'); }
    static error(msg)   { ToastManager.show(msg, 'error'); }
    static info(msg)    { ToastManager.show(msg, 'info'); }
    static warning(msg) { ToastManager.show(msg, 'warning'); }
}
