<template>
    <div class="animated-bg" :class="variant">

    </div>
</template>

<script setup>
defineProps({
    variant: {
        type: String,
        default: "light",
    },
});
</script>

<style scoped>
.login-bg {
    background-color: #eafbe0;
    background-image:
        radial-gradient(circle at 20% 30%, rgba(255, 255, 255, 0.9) 0%, transparent 40%),
        radial-gradient(circle at 80% 20%, rgba(180, 240, 140, 0.9) 0%, transparent 45%),
        radial-gradient(circle at 30% 80%, rgba(60, 170, 40, 0.85) 0%, transparent 45%),
        radial-gradient(circle at 85% 75%, rgba(20, 130, 20, 0.8) 0%, transparent 50%),
        linear-gradient(135deg, #eafbe0 0%, #8de06a 55%, #3fae2a 100%);
    background-size: 200% 200%, 200% 200%, 200% 200%, 200% 200%, 100% 100%;
    animation: liquidMove 12s ease-in-out infinite;
}

@keyframes liquidMove {
    0% {
        background-position: 20% 30%, 80% 20%, 30% 80%, 85% 75%, 0% 0%;
    }

    25% {
        background-position: 40% 60%, 60% 40%, 50% 60%, 60% 50%, 0% 0%;
    }

    50% {
        background-position: 70% 20%, 30% 70%, 70% 30%, 40% 80%, 0% 0%;
    }

    75% {
        background-position: 30% 50%, 70% 60%, 40% 40%, 70% 30%, 0% 0%;
    }

    100% {
        background-position: 20% 30%, 80% 20%, 30% 80%, 85% 75%, 0% 0%;
    }
}
</style>