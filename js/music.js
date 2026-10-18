(() => {
  const {config,$,available}=window.Wedding;
  if(!available(config.music.src))return;
  const audio=new Audio();audio.preload='none';audio.loop=true;audio.volume=Math.max(0,Math.min(1,config.music.volume ?? .35));audio.src=config.music.src;
  const button=$('music-toggle');button.disabled=false;button.textContent='Music off';$('music-status').textContent='A little atmosphere, only if you wish.';
  function update(){button.textContent=audio.paused?'Music off':'Music on';button.setAttribute('aria-pressed',String(!audio.paused));button.closest('.music-bar')?.classList.toggle('is-playing',!audio.paused);$('music-status').textContent=audio.paused?'A little atmosphere, only if you wish.':'Select Music on to pause.';}
  audio.addEventListener('play',update);audio.addEventListener('pause',update);
  audio.addEventListener('error',()=>{button.closest('.music-bar')?.classList.remove('is-playing');button.disabled=true;button.textContent='Music unavailable';button.setAttribute('aria-pressed','false');$('music-status').textContent='The soundtrack could not be loaded.';});
  button.addEventListener('click',async()=>{if(!audio.paused){audio.pause();return;}try{await audio.play();$('music-status').textContent='Select Music on to pause.';}catch{$('music-status').textContent='Playback unavailable. You can try again.';}});
})();
