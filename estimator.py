def estimate_min_sales(price: int, high_rating_count: int) -> dict:
    """
    高評価数から最低売上予測を算出する。

    Args:
        price: 販売価格（円）
        high_rating_count: 高評価数

    Returns:
        {
            "rating_rate": "30%",
            "estimated_buyers": 27,
            "estimated_sales": 80460
        }
    """
    # 価格帯別の高評価率（保守的シナリオ＝高めの率を仮定）
    if price <= 500:
        rate = 0.20
    elif price <= 1500:
        rate = 0.25
    elif price <= 3000:
        rate = 0.30
    elif price <= 5000:
        rate = 0.35
    else:
        rate = 0.40

    estimated_buyers = max(high_rating_count, round(high_rating_count / rate))
    estimated_sales = price * estimated_buyers

    return {
        "rating_rate": f"{int(rate * 100)}%",
        "estimated_buyers": estimated_buyers,
        "estimated_sales": estimated_sales,
    }
