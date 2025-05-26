<template>
  <div id="imageModal" class="modal">
    <span class="close">&times;</span>
    <img class="modal-content" id="modalImg">
    <div id="caption"></div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
  // 获取模态框元素
  const modal = document.getElementById('imageModal')
  const modalImg = document.getElementById('modalImg')
  const captionText = document.getElementById('caption')
  const closeBtn = document.getElementsByClassName('close')[0]
  
  // 为所有图片添加点击事件
  const images = document.querySelectorAll('.image-item img')
  images.forEach(function(img) {
    img.onclick = function() {
      modal.style.display = 'block'
      modalImg.src = this.src
      captionText.innerHTML = this.alt || this.parentElement.querySelector('p')?.textContent || ''
    }
  })
  
  // 点击关闭按钮关闭模态框
  closeBtn.onclick = function() {
    modal.style.display = 'none'
  }
  
  // 点击模态框外部关闭模态框
  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = 'none'
    }
  }
})
</script>

<style scoped>
/* 图片预览模态框样式 */
.modal {
  display: none;
  position: fixed;
  z-index: 1000;
  padding-top: 50px;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  overflow: auto;
  background-color: rgba(0, 0, 0, 0.9);
}

.modal-content {
  margin: auto;
  display: block;
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
}

#caption {
  margin: auto;
  display: block;
  width: 80%;
  max-width: 700px;
  text-align: center;
  color: #ccc;
  padding: 10px 0;
  height: 150px;
}

.modal-content, #caption {
  animation-name: zoom;
  animation-duration: 0.6s;
}

@keyframes zoom {
  from {transform: scale(0)}
  to {transform: scale(1)}
}

.close {
  position: absolute;
  top: 15px;
  right: 35px;
  color: #f1f1f1;
  font-size: 40px;
  font-weight: bold;
  transition: 0.3s;
  z-index: 1001;
}

.close:hover,
.close:focus {
  color: #bbb;
  text-decoration: none;
  cursor: pointer;
}

@media only screen and (max-width: 700px) {
  .modal-content {
    width: 100%;
  }
}
</style>