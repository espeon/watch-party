export const pling = () => {
  const maxGain = 0.3;
  const duration = 0.22;
  const fadeDuration = 0.1;
  const secondBeepOffset = 0.05;
  const thirdBeepOffset = 2 * secondBeepOffset;

  const ctx = new AudioContext();

  const firstBeepGain = ctx.createGain();
  firstBeepGain.connect(ctx.destination);
  firstBeepGain.gain.setValueAtTime(0.01, ctx.currentTime);
  firstBeepGain.gain.exponentialRampToValueAtTime(
    maxGain,
    ctx.currentTime + fadeDuration
  );
  firstBeepGain.gain.setValueAtTime(
    maxGain,
    ctx.currentTime + (duration - fadeDuration)
  );
  firstBeepGain.gain.exponentialRampToValueAtTime(
    0.01,
    ctx.currentTime + duration
  );

  const firstBeep = ctx.createOscillator();
  firstBeep.connect(firstBeepGain);
  firstBeep.frequency.value = 400;
  firstBeep.type = "sine";

  const secondBeepGain = ctx.createGain();
  secondBeepGain.connect(ctx.destination);
  secondBeepGain.gain.setValueAtTime(0.01, ctx.currentTime + secondBeepOffset);
  secondBeepGain.gain.exponentialRampToValueAtTime(
    maxGain,
    ctx.currentTime + secondBeepOffset + fadeDuration
  );
  secondBeepGain.gain.setValueAtTime(
    maxGain,
    ctx.currentTime + secondBeepOffset + (duration - fadeDuration)
  );
  secondBeepGain.gain.exponentialRampToValueAtTime(
    0.01,
    ctx.currentTime + secondBeepOffset + duration
  );

  const secondBeep = ctx.createOscillator();
  secondBeep.connect(secondBeepGain);
  secondBeep.frequency.value = 600;
  secondBeep.type = "sine";

  const thirdBeepGain = ctx.createGain();
  thirdBeepGain.connect(ctx.destination);
  thirdBeepGain.gain.setValueAtTime(0.01, ctx.currentTime + thirdBeepOffset);
  thirdBeepGain.gain.exponentialRampToValueAtTime(
    maxGain,
    ctx.currentTime + thirdBeepOffset + fadeDuration
  );
  thirdBeepGain.gain.setValueAtTime(
    maxGain,
    ctx.currentTime + thirdBeepOffset + (duration - fadeDuration)
  );
  thirdBeepGain.gain.exponentialRampToValueAtTime(
    0.01,
    ctx.currentTime + thirdBeepOffset + duration
  );

  const thirdBeep = ctx.createOscillator();
  thirdBeep.connect(thirdBeepGain);
  thirdBeep.frequency.value = 900;
  thirdBeep.type = "sine";

  firstBeep.start(ctx.currentTime);
  firstBeep.stop(ctx.currentTime + duration);
  secondBeep.start(ctx.currentTime + secondBeepOffset);
  secondBeep.stop(ctx.currentTime + (secondBeepOffset + duration));
  thirdBeep.start(ctx.currentTime + thirdBeepOffset);
  thirdBeep.stop(ctx.currentTime + (thirdBeepOffset + duration));
};
