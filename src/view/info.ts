// src/view/info.ts
export const info_tpl = `
<ul class="pages-personal">
  <% if (!it.list || it.list.length === 0) { %>
    <li class="pages-personal-li row">
      <div class="flex-auto">
        <p class="text font-size-14 color-gray-500">暂无配置项</p>
      </div>
    </li>
  <% } else { %>
    <% it.list.forEach(function(item) { %>
      <li class="pages-personal-li row" data-key="<%= item.key %>">
        <div class="flex-auto">
          <p class="text font-size-14 color-gray-900">
            <%= item.title || item.key %>
          </p>
          <p class="span mt-4 font-size-12 color-gray-500" data-role="display">
            <span data-role="value"><%= item.value || '未设置' %></span>
            <% if (item.description) { %>
              &nbsp;|&nbsp;<%= item.description %>
            <% } %>
          </p>
        </div>
        <button class="vg-btn btn-size-md" data-role="edit-btn" data-key="<%= item.key %>">编辑</button>
      </li>
    <% }); %>
  <% } %>
</ul>
`;
