# 融合计费系统 API 接口文档

## 目录
- [通用说明](#通用说明)
- [仪表盘接口](#仪表盘接口)
- [用户管理接口](#用户管理接口)
- [充值管理接口](#充值管理接口)

---

## 通用说明

### 基础信息
- **Base URL**: `/api`
- **Content-Type**: `application/json`
- **字符编码**: UTF-8

### 认证方式
所有接口（除登录外）都需要在请求头中携带 JWT Token：

```
Authorization: Bearer {token}
```

### 通用响应格式
所有接口返回统一的 JSON 格式：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

### 状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未授权，需要登录 |
| 403 | 无权限访问 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

### 分页参数
列表接口支持分页，参数如下：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |

### 错误响应示例
```json
{
  "code": 400,
  "msg": "参数错误：用户名不能为空",
  "data": null
}
```

---

## 仪表盘接口

### 1. 获取仪表盘统计数据

**接口地址**: `GET /api/dashboard/stats`

**请求参数**: 无

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "totalUsers": 1234,
    "todayRecharge": 5678.00,
    "pendingAudit": 12
  }
}
```

**数据字段说明**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| totalUsers | number | 总用户数 |
| todayRecharge | number | 今日充值金额（元） |
| pendingAudit | number | 待审核充值数量 |

**错误示例**:
```json
{
  "code": 500,
  "msg": "服务器内部错误",
  "data": null
}
```

---

## 用户管理接口

### 1. 获取用户列表

**接口地址**: `GET /api/users`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "user1",
        "role": "普通用户",
        "status": "正常",
        "phone": "13800138001",
        "packageName": "畅享套餐99元",
        "accountStatus": "正常",
        "lastRechargeTime": "2024-01-15 10:30:00",
        "phones": [
          {
            "phone": "13800138001",
            "phoneId": "13800138001"
          },
          {
            "phone": "13800138002",
            "phoneId": "13800138002"
          }
        ]
      }
    ],
    "total": 100
  }
}
```

**数据字段说明**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | number | 用户ID |
| username | string | 用户名 |
| role | string | 用户角色 |
| status | string | 用户状态（正常/禁用） |
| phone | string | 主手机号 |
| packageName | string | 套餐名称 |
| accountStatus | string | 账户状态（正常/欠费/冻结/注销） |
| lastRechargeTime | string | 最近充值时间 |
| phones | array | 关联手机号列表 |
| phones[].phone | string | 手机号 |
| phones[].phoneId | string | 手机号ID |

---

### 2. 获取用户消费记录

**接口地址**: `GET /api/users/consumption`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "username": "user1",
        "phone": "13800138001",
        "amount": 58.00,
        "type": "流量包",
        "time": "2024-01-15 10:30:00",
        "description": "购买500MB流量包"
      }
    ],
    "total": 50
  }
}
```

**数据字段说明**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | number | 记录ID |
| username | string | 用户名 |
| phone | string | 手机号 |
| amount | number | 消费金额 |
| type | string | 消费类型（流量包/通话费/短信费/套餐费） |
| time | string | 消费时间 |
| description | string | 消费描述 |

---

### 3. 获取用户套餐使用情况

**接口地址**: `GET /api/users/package`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "username": "user1",
        "phone": "13800138001",
        "packageName": "畅享套餐99元",
        "totalData": 20,
        "usedData": 8.5,
        "dataPercentage": 43,
        "totalVoice": 500,
        "usedVoice": 120,
        "voicePercentage": 24,
        "totalSms": 100,
        "usedSms": 35,
        "smsPercentage": 35
      }
    ],
    "total": 100
  }
}
```

**数据字段说明**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| username | string | 用户名 |
| phone | string | 手机号 |
| packageName | string | 套餐名称 |
| totalData | number | 总流量（GB） |
| usedData | number | 已使用流量（GB） |
| dataPercentage | number | 流量使用百分比 |
| totalVoice | number | 总语音时长（分钟） |
| usedVoice | number | 已使用语音时长（分钟） |
| voicePercentage | number | 语音使用百分比 |
| totalSms | number | 总短信条数 |
| usedSms | number | 已使用短信条数 |
| smsPercentage | number | 短信使用百分比 |

---

### 4. 查询用户

**接口地址**: `POST /api/users/query`

**请求参数**:
```json
{
  "username": "user1"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| username | string | 是 | 用户名 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "查询成功",
  "data": [
    {
      "id": 1,
      "username": "user1",
      "balance": 1000.00
    }
  ]
}
```

**数据字段说明**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | number | 用户ID |
| username | string | 用户名 |
| balance | number | 账户余额 |

---

## 充值管理接口

### 1. 获取充值记录列表

**接口地址**: `GET /api/recharge`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 10 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "获取成功",
  "data": {
    "list": [
      {
        "id": 1,
        "phone": "13800138001",
        "amount": 100.00,
        "time": "2024-01-15 10:30:00",
        "status": "待审核",
        "method": "微信支付"
      }
    ],
    "total": 50
  }
}
```

**数据字段说明**:
| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | number | 充值记录ID |
| phone | string | 手机号 |
| amount | number | 充值金额 |
| time | string | 充值时间 |
| status | string | 充值状态（待审核/已审核/已拒绝） |
| method | string | 充值方式 |

---

### 2. 审核充值

**接口地址**: `POST /api/recharge/audit`

**请求参数**:
```json
{
  "id": 1,
  "status": "approved",
  "remark": "审核通过"
}
```

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| id | number | 是 | 充值记录ID |
| status | string | 是 | 审核状态（approved-通过/rejected-拒绝） |
| remark | string | 否 | 审核备注 |

**响应示例**:
```json
{
  "code": 200,
  "msg": "审核成功",
  "data": null
}
```

---

## 数据缓存策略

### 缓存配置
| 数据类型 | 缓存时间 | 说明 |
|---------|----------|------|
| 仪表盘数据 | 5 分钟 | 相对稳定，更新频率低 |
| 用户列表 | 1 分钟 | 数据变化较频繁 |
| 消费记录 | 1 分钟 | 数据变化较频繁 |
| 套餐使用 | 5 分钟 | 相对稳定 |
| 充值记录 | 1 分钟 | 数据变化较频繁 |

### 缓存失效
- 用户登录/登出时清空所有缓存
- 执行审核/拒绝操作时清空相关缓存
- 缓存超时自动失效

---

## 错误处理

### 网络错误
- **现象**: 请求超时或网络断开
- **处理**: 显示友好提示，建议用户检查网络连接
- **示例**: "网络错误，请检查网络连接后重试"

### 服务器错误
- **现象**: 服务器返回 500 错误
- **处理**: 显示服务器错误提示，记录错误日志
- **示例**: "服务器内部错误，请稍后重试"

### 权限错误
- **现象**: 返回 401 或 403 错误
- **处理**: 401 自动跳转登录页，403 显示无权限提示
- **示例**: "您没有权限访问该资源"

---

## 实现建议

### 前端实现
1. 使用 axios 拦截器统一处理请求和响应
2. 实现数据缓存机制，减少不必要的请求
3. 所有异步操作添加加载状态提示
4. 使用 ElNotification 组件显示操作结果
5. 成功提示 3 秒后自动消失，失败提示 5 秒后消失

### 后端实现
1. 统一响应格式，使用 code、msg、data 结构
2. 实现完善的参数校验
3. 添加详细的日志记录
4. 实现分页查询功能
5. 支持数据排序和筛选

---

## 版本历史
- **v1.0.0** (2024-01-15): 初始版本
